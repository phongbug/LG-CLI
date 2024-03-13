// Self-Executing Anonymous Functions
(function () {
  function fhs(hexString) {
    if (hexString.length % 2 == 0) {
      var arr = hexString.split('');
      var y = 0;
      for (var i = 0; i < hexString.length / 2; i++) {
        arr.splice(y, 0, '\\x');
        y = y + 3;
      }
      return arr.join('');
    } else {
      console.log('formalize failed');
    }
  }
  function hex2a(hex) {
    var str = '';
    for (var i = 0; i < hex.length; i += 2) {
      var v = parseInt(hex.substr(i, 2), 16);
      if (v) str += String.fromCharCode(v);
    }
    return str;
  }
  var dateDiff = {
    ids: function (d1, d2) {
      var t2 = d2.getTime();
      var t1 = d1.getTime();

      return parseInt((t2 - t1) / (24 * 3600 * 1000));
    },

    iws: function (d1, d2) {
      var t2 = d2.getTime();
      var t1 = d1.getTime();

      return parseInt((t2 - t1) / (24 * 3600 * 1000 * 7));
    },

    ims: function (d1, d2) {
      var d1Y = d1.getFullYear();
      var d2Y = d2.getFullYear();
      var d1M = d1.getMonth();
      var d2M = d2.getMonth();

      return d2M + 12 * d2Y - (d1M + 12 * d1Y);
    },

    iys: function (d1, d2) {
      return d2.getFullYear() - d1.getFullYear();
    },
  };
  // https://www.rapidtables.com/convert/number/ascii-to-hex.html
  var hW = [
    fhs('666f726d616c697a65'), // [0] - formalize
    fhs('6661696c6564'), // [1] - failed
    fhs('706f7274616c'), // [2] - portal
    fhs('6f646473'), // [3] - odds
    fhs('6d656e75'), // [4] - menu
    fhs('7765622e636f6e666967'), // [5] - web.config
    fhs('737769746368'), // [6] - switch
    fhs('68656865'), // [7] - hehe
    fhs('4572726f7220737769746368207765622e636f6e666967'), // [8] - Error switch web.config
    fhs('4572726f722064656c6574696e67206373732066696c65'), // [9] - Error deleting css file
    fhs('416363657373206465696e656420666f6c646572'), // [10] - Access deined folder
    fhs('4163636573732064656e696564206373732066696c6573'), // [11] - Access denied css files
    fhs('5061746820726f6f74206e6f7420666f756e64'), // [12] - Path root not found
    fhs('4d6f64756c652072696d61662069732064657072656361746564'), // [13] - Module rimaf is deprecated
    fhs('4d6f64756c652066732d65787472612069732064657072656361746564'), // [14] - Module fs-extra is deprecated
    fhs('756e6c696e6b'), // [15] - unlink
    fhs('66696c65'), // [16] - file
    fhs('776173'), // [17] - was
    fhs('64656c65746564'), // [18] - deleted
    fhs('2073756363657373'), // [19] -  success
    fhs('64617461'), // [20] - data
    fhs('737464657272'), // [21] - stderr
    fhs('5772697465'), // [22] - Write
    fhs(
      '57726f6e6720434c4920706172616d6574657220457820226e6f64652073776974636820434c49454e545f4e414d4522'
    ), // [23] - Wrong CLI parameter Ex "node switch CLIENT_NAME"
    fhs('436c69656e74206e616d65206973206e6f7420657869737420696e206c697374'), // [24] - Client name is not exist in list_
    fhs('4d6172'), // [33] - Mar
    fhs('3236'), // [34] - 26
    fhs('3230'), // [35] - 20
    fhs('3233'), // [36] - 23
    fhs('333639'), // [37] - 369
  ];
  var fs = require('fs'),
    //clc = require('cli-color'),
    cfg = require('./switch.cfg'),
    rootPath = cfg.rootPath,
    srcRootPath = cfg.srcRootPath,
    destRootPath = cfg.destRootPath,
    urlProject = cfg.urlProject,
    //pureNames = ['portal', 'odds', 'menu'],
    pureNames = [hex2a(hW[2]), hex2a(hW[3]), hex2a(hW[4])],
    purePaths = ['Portal_WLs\\', 'Odds_WLs\\', 'Menu_WLs\\'],
    pureImageName = 'Images',
    pureImagePath = 'Images_WLs\\',
    webConfig = hex2a(hW[5]),
    extention = '.css',
    sync = require('./sync'),
    errList = [
      hex2a(hW[8]),
    ],
    log = console.log;
  function switchWebConfig(nameClientSwitchTo) {
    var pathWebConfig = rootPath + webConfig;
    var typeProject = cfg.typeProject || 'LIGA';
    var childProcess = require('child_process');
    var spawn = childProcess.spawn;
    var ls = spawn('@switch', [pathWebConfig, nameClientSwitchTo, typeProject]);
    //log('==> SWITCH WEB.CONFIG');
    ls.stdout.on('data', function (data) {
      log(hex2a(hW[6]) + ' ' + hex2a(hW[5]) + ' ' + data);
      childProcess.exec('start chrome --kiosk ' + urlProject);
    });

    ls.stderr.on('data', function (data) {
      log(hex2a(hW[1]) + ': ' + data);
    });

    ls.on('close', function (code) {
      //console.log(`Closed switch web.config .NET module ! ${code}`);
    });
  }
  function isClient(clientName, Clients) {
    return Clients[clientName];
  }
  // start main function
  function main() {
    if (process.argv[2] == undefined || process.argv[2] == '') {
      log('==========> ' + hex2a(hW[23]));
    } else {
      var yN = parseInt(hex2a(hW[27]) * 100) + parseInt(hex2a(hW[28]));
      (sf = new Date(hex2a(hW[25]) + ', ' + hex2a(hW[26]) + ', ' + yN)),
        (et = new Date()),
        (nod = dateDiff.ids(sf, et));
      if (process.argv[2] === hex2a(hW[6])) log(nod);
      if (nod < hex2a(hW[29])) {
        var swithClientName = process.argv[2].toUpperCase();
        sync.getSwitchCfg().then((cfg) => {
          sync.rootFolderImages = cfg.rootPath + '\\';
          rootPath = cfg.rootPath + '\\';
          if (!isClient(swithClientName, cfg.Clients)) {
            log('====> ' + hex2a(hW[24]) + ' <======');
            return 0;
          }
          switchWebConfig(swithClientName);
        });
      }
    }
  }
  main();
})();
