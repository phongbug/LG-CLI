const JavaScriptObfuscator = require('javascript-obfuscator'),
  fs = require('fs'),
  log = console.log;

function build({ srcName, destName }) {
  var code = fs.readFileSync(srcName, 'utf8');
  //log(code);
  var obfuscationResult = JavaScriptObfuscator.obfuscate(code, {
    compact: true,
    controlFlowFlattening: false,
    deadCodeInjection: false,
    debugProtection: false,
    debugProtectionInterval: false,
    disableConsoleOutput: false,
    identifierNamesGenerator: 'hexadecimal',
    log: false,
    numbersToExpressions: false,
    renameGlobals: true,
    rotateStringArray: true,
    selfDefending: false,
    shuffleStringArray: true,
    simplify: true,
    splitStrings: false,
    stringArray: true,
    stringArrayEncoding: [],
    stringArrayIndexShift: true,
    stringArrayWrappersCount: 1,
    stringArrayWrappersChainedCalls: true,
    stringArrayWrappersParametersMaxCount: 2,
    stringArrayWrappersType: 'variable',
    stringArrayThreshold: 0.75,
    unicodeEscapeSequence: false
  });
  //log(obfuscationResult);
  let fileName = (destName ? destName : srcName).split(/(\\|\/)/g).pop();
  fs.writeFile('build/' + fileName, obfuscationResult, function (err) {
    if (err) log(err);
    log('build/' + fileName + ' was save');
  });
  // var result = UglifyJS.minify(code);
  // console.log(result.error); // runtime error, or `undefined` if no error
  // console.log(result.code);  // minified output: function add(n,d){return n+d}
}
build({ srcName: 'sync.js' });
build({ srcName: 's.js' });
build({ srcName: 'c.js' });
build({ srcName: 'setup/delete.js' });
build({ srcName: 'setup/help.js' });
build({ srcName: 'setup/setup.js' });
build({ srcName: 'setup/update.js' });
build({ srcName: 'rdservice.js' });
build({ srcName: 'rd.js' });
fs.copyFile('./swcfg/bin/Release/@switch.exe', './build/@switch.exe', (err) => {
  if (err) {
    log('Error Found:', err);
  } else {
    log('Copied @switch.exe');
  }
});
fs.copyFile('./setup/package.json', './build/package.json', (err) => {
  if (err) {
    log('Error Found:', err);
  } else {
    log('Copied package.json');
  }
});
