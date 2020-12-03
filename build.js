const JavaScriptObfuscator = require('javascript-obfuscator'),
  fs = require('fs'),
  log = console.log;

function build({ srcName, destName }) {
  var code = fs.readFileSync(srcName, 'utf8');
  //log(code);
  var obfuscationResult = JavaScriptObfuscator.obfuscate(code);
  log(obfuscationResult);
  fs.writeFile(
    'build/' + (destName ? destName : srcName),
    obfuscationResult,
    function (err) {
      if (err) log(err);
      log('build/' + (destName ? destName : srcName) + ' was save');
    }
  );
  // var result = UglifyJS.minify(code);
  // console.log(result.error); // runtime error, or `undefined` if no error
  // console.log(result.code);  // minified output: function add(n,d){return n+d}
}
build({ srcName: 'sml.js', destName: 'sync.js' });
build({ srcName: 's.js' });
build({ srcName: 'c.js' });
