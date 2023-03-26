let cfg = require('./switch.cfg'),
  log = console.log,
  fs = require('fs'),
  delay = async (ms) => {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  };
// Clone a list file to new list file
async function cloneImagesOneWL({ files, whiteLabelName, clonePath }) {
  for (file of files) {
    let rootPath = cfg.rootPath,
      srcFile =
        rootPath + 'Images_WLs\\Images_' + whiteLabelName + '\\' + file.srcName,
      destFile =
        (clonePath ? clonePath : rootPath) +
        'Images_Clone\\Images_' +
        whiteLabelName +
        '\\' +
        file.destName,
      destPath = require('path').dirname(destFile);
    require('shelljs').mkdir('-p', destPath);
    try {
      fs.createReadStream(srcFile).pipe(fs.createWriteStream(destFile));
    } catch (error) {
      log('Error ==> %s', whiteLabelName);
      log(error);
    }
    //log("Copy " + srcFile + " to " + destFile + " success")
    //stream.on('finish', resolve)
  }
  log('Done %s', whiteLabelName);
  await delay(3333);
}
async function cloneImagesWLs({ files, whiteLabelNameList, clonePath }) {
  for (whiteLabelName of whiteLabelNameList)
    await cloneImagesOneWL({
      files: files,
      whiteLabelName: whiteLabelName,
      clonePath: clonePath,
    });
}

// Clone a folders to new folder
function cloneFolderOneWL(srcImagesFolder, destImagesFolder, callback) {
  log('==> Clone a source folder to dest folder ');
  let fsEx = require('fs-extra');
  if (!fs.existsSync(destImagesFolder)) fs.mkdirSync(destImagesFolder);
  fsEx.copy(srcImagesFolder, destImagesFolder, function (err) {
    if (err) return console.error(err);
    log('Copy ' + srcImagesFolder + ' to ' + destImagesFolder + ' success');
    callback();
  });
}
function cloneFolderWLs(whiteLabelList, srcImagesFolder) {
  let rootPath = cfg.rootPath;
  srcImagesFolder = rootPath + srcImagesFolder;
  for (let i = 0; i < whiteLabelList.length; i++) {
    destImagesFolder = rootPath + 'Images_Clone\\Images_' + whiteLabelList[i];
    cloneFolderOneWL(srcImagesFolder, destImagesFolder, () => {
      if (i === whiteLabelList.length - 1) log('Done all!');
    });
  }
}

(async function () {
  let sync = require('./sync');
  // cloneImagesWLs({ files: [{ srcName: 'btn/others.jpg', destName: 'btn/bg.png' }], whiteLabelNameList: await sync.getActiveWhiteLabel() })
  // Backup
  //log(a);
  /**
   * Will clone from source Images/ folder to Images_Clone folder at Projects/ folder
   */
  let list = await sync.getAllWhiteLabels();
  log(list.length);
  cloneFolderWLs(list, 'Images');
  //   cloneImagesWLs({
  //     files: [
  //       { srcName: 'panel/bg_Btn.jpg', destName: 'panel/bg_Btn.jpg' },
  //     ],
  //     whiteLabelNameList: ['LG', 'VIN', 'PUG'],
  //   });
})();
