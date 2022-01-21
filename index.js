var fs = require('fs');


var text = fs.readFileSync("./words.txt", 'utf-8');
var textByLine = text.split('\n');
const wordMap = new Map();

var totalLetters = 0;


textByLine.forEach(string => {
  if(string.length == 5) {
    var stringArr = string.split("");
    for (var i = 0; i < stringArr.length; i++) {
      ++totalLetters;
      if(wordMap.get(stringArr[i]) == null) {
        wordMap.set(stringArr[i], 1);
      } else {
        wordMap.set(stringArr[i], wordMap.get(stringArr[i]) + 1);
      }
  
    }
  }
})

const sortedMap = new Map([...wordMap.entries()].sort((a, b) => b[1] - a[1]));

sortedMap.forEach((values,keys) => {
  var percentage = (100 * values) / totalLetters;

  console.log(keys + " | " + Math.round(percentage * 100) / 100 + "%");


})