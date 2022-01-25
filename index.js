var fs = require('fs');

var pathPast = "./PastWordles.txt";
var pathAll = "./ShuffledWordles.txt";

console.log("Past Wordle Letter Distribution: \n")
printLetters(pathPast);
console.log("___________________________________________________________\n");
console.log("All Wordle Letter Distribution: \n")
printLetters(pathAll);

function printLetters(filePath) {
  var wordles = fs.readFileSync(filePath, 'utf-8');
  var wordlesArr = wordles.split(/\n|\,/);

  const wordlesMap = new Map();

  var totalLetters = 0;

  wordlesArr.forEach(string => {
    if(string.length != 5) return;

    var stringArr = string.split("");
    for (var i = 0; i < stringArr.length; i++) {
      ++totalLetters;
      if(wordlesMap.get(stringArr[i]) == null) {
        wordlesMap.set(stringArr[i], 1);
      } else {
        wordlesMap.set(stringArr[i], wordlesMap.get(stringArr[i]) + 1);
      }
    }
  })


  const sortedMapPast = new Map([...wordlesMap.entries()].sort((a, b) => b[1] - a[1]));

  sortedMapPast.forEach((values,keys) => {
    var percentage = (100 * values) / totalLetters;

    console.log(keys + " | " + Math.round(percentage * 100) / 100 + "%");
  })
}