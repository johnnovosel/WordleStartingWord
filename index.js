import fs from 'fs';
import {
  Config
} from "./Config.js";
const fetch = (...args) => import('node-fetch').then(({
  default: fetch
}) => fetch(...args));

function setOccuranceMap(wordlesArr) {
  let occuranceMap = new Map();
  let totalLetters = 0;
  wordlesArr.forEach(string => {
    if (string.length != 5) return;

    var stringArr = string.split("");
    for (var i = 0; i < stringArr.length; i++) {
      ++totalLetters;
      if (occuranceMap.get(stringArr[i]) == null) {
        occuranceMap.set(stringArr[i], 1);
      } else {
        occuranceMap.set(stringArr[i], occuranceMap.get(stringArr[i]) + 1);
      }
    }
  })

  const sortedLetterOccurance = new Map([...occuranceMap.entries()].sort((a, b) => b[1] - a[1]));

  sortedLetterOccurance.forEach((values, keys) => {
    var percentage = (100 * values) / totalLetters;

    sortedLetterOccurance.set(keys, Math.round(percentage * 1000) / 1000)
  })
  return sortedLetterOccurance;
}

function scoreWords(sortedOccuranceMap, wordlesArr) {
  let scoredMap = new Map();

  for (let i = 0; i < wordlesArr.length; i++) {
    let score = 0;
    let str = wordlesArr[i].split("");

    for (let j = 0; j < str.length; j++) {
      score += sortedOccuranceMap.get(str[j]);
    }
    scoredMap.set(wordlesArr[i], score);
  }
  return new Map([...scoredMap.entries()].sort((a, b) => b[1] - a[1]));
}

export default async function start(client) {
  let finalDisplayAnswerArr = []
  const answer = "lapse";
  const answerArr = answer.split("");
  let wordles = fs.readFileSync("././allowed_words.txt", 'utf-8');
  let wordlesArr = wordles.split(/\n|\,|\r/);
  wordlesArr = wordlesArr.filter(word => {
    if (word === '') return false;
    return true
  })
  let guessNumber = 1;
  while (guessNumber < 10) {
    let currentDisplayAnswerArr = [":black_large_square:", ":black_large_square:", ":black_large_square:", ":black_large_square:", ":black_large_square:"];

    let guess = await generateGuess(wordlesArr, guessNumber);
    // console.log(guess)


    if ((wordlesArr.length === 1 && wordlesArr[0] === answer) || guess === answer) {
      // console.log(`found wordle ${guess} in ${guessNumber} tries`)
      currentDisplayAnswerArr = [":green_square:", ":green_square:", ":green_square:", ":green_square:", ":green_square:"]
      finalDisplayAnswerArr.push(currentDisplayAnswerArr);
      displayResults(client, finalDisplayAnswerArr, guessNumber);
      break;
    }

    let guessArr = guess.split("");
    let notAtThisSpotButInWord = []
    let containsSet = new Set();
    let removeSet = new Set();
    let matchMap = [];

    for (let i = 0; i < guessArr.length; i++) {
      if (guessArr[i] === answerArr[i]) {
        matchMap.push([guessArr[i], i]);
        currentDisplayAnswerArr[i] = ":green_square:"
      }
    }
    wordlesArr = wordlesArr.filter(word => {
      let wordArr = word.split("");
      let passed = true;

      for (let index = 0; index < matchMap.length; index++) {
        if (wordArr[matchMap[index][1]] != matchMap[index][0]) {
          passed = false;
        }
      }
      return passed;
    })

    // get a list of letters in the word and letters not in the word
    for (let i = 0; i < guessArr.length; i++) {
      if (answerArr.includes(guessArr[i])) {
        containsSet.add(guessArr[i]);

        if (!arrayAlreadyHasArray(matchMap, [guessArr[i], i]))
          notAtThisSpotButInWord.push([guessArr[i], i]);
        if (currentDisplayAnswerArr[i] != ":green_square:" || "") {
          currentDisplayAnswerArr[i] = ":yellow_square:"
        }
      } else {
        removeSet.add(guessArr[i]);
        currentDisplayAnswerArr[i] = ":black_large_square:"
      }
    }

    // filter the word list of invalid words
    wordlesArr = wordlesArr.filter(word => {
      let wordArr = word.split("");
      let passed = true;

      // letter is in the word but not at this spot
      for (let i = 0; i < notAtThisSpotButInWord.length; i++) {
        if (wordArr[notAtThisSpotButInWord[i][1]] == notAtThisSpotButInWord[i][0])
          passed = false;
      }

      // word contains a letter it should not
      removeSet.forEach((letter) => {
        if (word.includes(letter)) {
          passed = false;
        }
      })

      // word does not contain a letter it should
      containsSet.forEach((letter) => {
        if (!word.includes(letter)) {
          passed = false;
        }
      })

      return passed;
    })

    guessNumber++;
    finalDisplayAnswerArr.push(currentDisplayAnswerArr);
  }

  return guessNumber;
}

async function generateGuess(wordlesArr, guessNumber) {
  if (guessNumber === 1) return "crate"

  let sortedLetterOccurance = setOccuranceMap(wordlesArr)
  let scoredWordsMap = scoreWords(sortedLetterOccurance, wordlesArr);
  let guess = null;

  // finds the best word to guess without repeated letters
  // words without repeated letters give us the most information so we want to try them first
  // if the "best" word is has a repeated letter, then it will reset the guess with the next best word without repeated letters
  // if no better word is found without repeated letters, then it will just use the guess it already has

  scoredWordsMap.forEach((values, keys) => {
    let keyArr = keys.split("")
    let testRepeatedLetterSet = new Set();
    for (let i = 0; i < keyArr.length; i++) {
      testRepeatedLetterSet.add(keyArr[i]);
    }
    if (testRepeatedLetterSet.size == 5 && guess === null) {
      guess = keys;
      return;
    }
  })

  if (wordlesArr.length < 10) {
    let mostCommonWord = null;
    let mostCommonFreq = 0;
    let guesses = await Promise.all(wordlesArr.map(word => findMostCommon(word)));
    for (let i = 0; i < guesses?.length; i++) {
      if(guesses[i]?.tags[0]?.substring(2) > mostCommonFreq) {
        mostCommonWord = guesses[i]?.word;
        mostCommonFreq = guesses[i]?.tags[0]?.substring(2);
      }
    }
    guess = mostCommonWord
  }

  if (guess == null) {
    [guess] = scoredWordsMap.keys();
  }

  return guess
}

async function findMostCommon(word) {
  let data = null;

  try {
    const response = await fetch('https://api.datamuse.com/words?sp=' + word + '&md=f&max=1', {});
    data = await response.json();
  } catch (error) {
    console.error(error);
    return null;
  }
  return data[0];
}

function displayResults(client, results, number) {
  const channel = client.channels.cache.get(Config.cobaltiumWordleChannel);

  // const image = fs.readFileSync('C:\\Users\\johnn\\Desktop\\cringe.jpg')

  // let message = `A new class system exists.\n\nNo longer is it admin vs men.\n\nIt is <@&950513850233548871> vs <@&950513369180422194>`
  let message = `Cortini is hotter than sam\n\nWordle 262 ${number}/6\n\n`
  for (let i = 0; i < results.length; i++) {
    message = message + results[i][0] + results[i][1] + results[i][2] + results[i][3] + results[i][4] + '\n';
  }
  channel.send(message);
}

async function test() {
  let wordles = fs.readFileSync("././Wordles.txt", 'utf-8');
  let wordlesArr = wordles.split(/\n|\,|\r/);
  wordlesArr = wordlesArr.filter(word => {
    if (word === '') return false;
    return true
  })
  let count = 0;
  let size = wordlesArr.length;

  for (let i = 0; i < wordlesArr.length; i++) {
    // count += await start(wordlesArr[i]);
  }

  console.log(`Average: ${count / size}`);
}

function arrayAlreadyHasArray(arr, subarr) {
  for (var i = 0; i < arr.length; i++) {
    let checker = false
    for (var j = 0; j < arr[i].length; j++) {
      if (arr[i][j] === subarr[j]) {
        checker = true
      } else {
        checker = false
        break;
      }
    }
    if (checker) {
      return true
    }
  }
  return false
}