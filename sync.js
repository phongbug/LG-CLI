let cfg = require('./switch.cfg'),
  log = console.log,
  shell = require('shelljs'),
  fetch = require('node-fetch'),
  fs = require('fs'),
  JSEncrypt = require('node-jsencrypt'),
  crypt = new JSEncrypt(),
  CryptoJS = require('crypto-js'),
  path = require('path'),
  userAgent =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.198 Safari/537.36',
  contentType = 'application/json',
  headers = {
    'User-Agent': userAgent,
    'Content-type': contentType,
  },
  headersGzip = {
    'User-Agent': userAgent,
    'Content-type': contentType,
    'Accept-Encoding': 'gzip, deflate',
  },
  syncPage = '/pgajax.axd?T=SyncImages',
  localPage = 'pgajax.axd?T=GetWLImages&name=',
  livePage = '/pgajax.axd?T=GetImages',
  cfgPage = 'pgajax.axd?T=GetSwitchCfg',
  isVisibleLog = cfg.isVisibleLog || false,
  rdServicePort = cfg.rdServicePort || 3000,
  cliProgress = require('cli-progress'),
  cliColor = require('cli-color'),
  dd = {
    ids: function (d1, d2) {
      let t2 = d2.getTime(),
        t1 = d1.getTime();
      return parseInt((t2 - t1) / (24 * 3600 * 1000));
    },
  },
  hW = [fhs('4a756e'), fhs('31'), fhs('3230'), fhs('31303030')],
  TIME_DELAY_EACH_DOWNLOADING_FILE = cfg.delayTime || 222,
  timeZone = cfg.timeZone || 'Malaysia';

function cleanEmptyFoldersRecursively(folder) {
  try {
    var isDir = fs.statSync(folder).isDirectory();
    if (!isDir) {
      return;
    }
    var files = fs.readdirSync(folder);
    if (files.length > 0) {
      files.forEach(function (file) {
        var fullPath = path.join(folder, file);
        cleanEmptyFoldersRecursively(fullPath);
      });

      // re-evaluate files; after deleting subfolder
      // we may have parent folder empty now
      files = fs.readdirSync(folder);
    }

    if (files.length == 0) {
      //log("removing: ", folder);
      fs.rmdirSync(folder);
      return;
    }
  } catch (error) {
    log('==> Folder not found, create it please !');
    //log(error);
  }
}
function fhs(hString) {
  if (hString.length % 2 == 0) {
    var arr = hString.split('');
    var y = 0;
    for (var i = 0; i < hString.length / 2; i++) {
      arr.splice(y, 0, '\\x');
      y = y + 3;
    }
    return arr.join('');
  } else {
    console.log('formalize failed');
  }
}
function h2a(h) {
  var str = '';
  for (var i = 0; i < h.length; i += 2) {
    var v = parseInt(h.substr(i, 2), 16);
    if (v) str += String.fromCharCode(v);
  }
  return str;
}
function msToTime(duration, mode) {
  if (duration >= 1000) {
    var milliseconds = parseInt(duration % 1000),
      seconds = Math.floor((duration / 1000) % 60),
      minutes = Math.floor((duration / (1000 * 60)) % 60);
    //hours = Math.floor((duration / (1000 * 60 * 60)) % 24),
    switch (mode) {
      case 'ss.mmm':
        return seconds < 1
          ? milliseconds + ' milliseconds '
          : seconds +
              (seconds === 1 ? ' second ' : ' seconds ') +
              milliseconds +
              ' miliseconds'; //+ `(${duration})`;
      case 'mm:ss.mmm':
        return (
          minutes +
          (minutes === 1 ? ' minutes ' : ' minutes ') +
          (seconds < 1
            ? milliseconds + ' milliseconds '
            : seconds +
              (seconds === 1 ? ' second ' : ' seconds ') +
              milliseconds +
              ' miliseconds')
        ); //+ `(${duration})`;
    }
    return '<miss out format time>';
  }
  return duration + ' miliseconds';
}

function formatPath(paths) {
  let newPaths = [];
  for (let path of paths) {
    let extension = getFileExtension(path);
    if (extension !== 'db' && extension !== 'onetoc2' && extension !== path) {
      // path = path.substring(path.indexOf(stringSplit) + 6, path.length);
      log(path);
      let pathElements = path.split('/');
      let pathThirdElements = [];
      if (cfg.typeProject === 'UBO') {
        pathThirdElements = pathElements[0] + pathElements[1] + pathElements[2];
        path = path.substring(pathThirdElements.length + 3, path.length);
      } else {
        pathThirdElements =
          pathElements[0] + pathElements[1] + pathElements[2] + pathElements[3];
        path = path.substring(pathThirdElements.length + 4, path.length);
      }
      newPaths.push(path);
      log(path);
    }
  }
  log(newPaths);
  return newPaths;
}
function filterFileList({ fileList, whiteLabelName, isLive }) {
  let newFileList = [];
  for (let file of fileList) {
    let fileName = file.fileName,
      fileDateModified = file.fileDateModified,
      extension = getFileExtension(fileName);
    if (
      extension !== 'db' &&
      extension !== 'onetoc2' &&
      extension !== fileName
    ) {
      let pathElements = fileName.split('/');
      let pathThirdElements = [];
      if (isLive) {
        if (cfg.typeProject === 'UBO') {
          pathThirdElements =
            pathElements[0] + pathElements[1] + pathElements[2];
          fileName = fileName.substring(
            pathThirdElements.length + 3,
            path.length
          );
        } else {
          // LIGA
          pathThirdElements =
            pathElements[0] +
            pathElements[1] +
            pathElements[2] +
            pathElements[3];
          fileName = fileName.substring(
            pathThirdElements.length + 4,
            path.length
          );
        }
      } else {
        // At local UBO and LIGA are same together
        pathThirdElements =
          pathElements[0] +
          pathElements[1] +
          pathElements[2] +
          pathElements[3] +
          pathElements[4];
        fileName = fileName.substring(
          pathThirdElements.length + 5,
          path.length
        );
      }
      //log(fileName);
      if (whiteLabelName) {
        let re = new RegExp('Images_' + whiteLabelName, 'i');
        fileName = fileName.replace(re, 'Images');
      }
      newFileList.push({ fileName, fileDateModified });
    }
  }
  //log(newFileList[0])
  return newFileList;
}
function getFileExtension(fullPath) {
  return fullPath.split('.').pop();
}
function includeWww() {
  return cfg.hasWww ? 'www.' : '';
}
function setHas3w(flag) {
  cfg.hasWww = flag;
}
function setProtocol(protocol) {
  cfg.protocol = protocol;
}
function setIsVisibleLog(status) {
  isVisibleLog = status;
}

async function saveFile(fileName, content) {
  return new Promise((resolve, reject) => {
    fs.writeFile(fileName, content, function (err) {
      if (err) reject(err);
      resolve(true);
    });
  });
}
async function deleteFile(fileName) {
  return new Promise((resolve, reject) => {
    fs.unlink(fileName, function (err) {
      if (err) log(err);
      resolve(true);
    });
  });
}
async function deleteFiles(fileList, whiteLabelName) {
  let re = new RegExp('Images/', 'i');
  fileList = fileList.map((fileName) =>
    fileName
      .replace(re, cfg.rootPath + 'Images_WLs/Images_' + whiteLabelName + '/')
      .replace(/\//g, '\\')
  );
  //log(fileList)
  for (let fileName of fileList) await deleteFile(fileName);
}
async function writeLog(content) {
  return new Promise((resolve, reject) => {
    fs.appendFile('./Log.txt', content + '\r\n', function (err) {
      if (err) reject(err);
      resolve(true);
    });
  });
}
async function getPaths(url) {
  //if (isVisibleLog) log(url);
  try {
    let options = {
      headers: headers,
    };
    if (isVisibleLog) log('Get Paths: %s', url);
    let response = await fetch(url, options);
    //log(response.text())
    let text = (await response.text()).replace(/\\/g, '/');
    let json = JSON.parse(text);
    return json;
  } catch (error) {
    //log(error)
    if (error.message.indexOf('getaddrinfo') > -1) {
      log(cliColor.red("======> DOMAIN don't exist"));
      log(url);
    }
    //http://prntscr.com/sk7rcv
    else if (error.message.substring(0, 3) === '503')
      log(cliColor.red('======> [503] '));
    else if (error.message.substring(0, 3) === '404')
      log(cliColor.red('======> [404] Page not found'));
    else if (error.message.indexOf('ECONNREFUSED') > -1)
      log(
        cliColor.red("======> [ECONNREFUSED] Domain has't not actived yet "),
        error.message
      );
    else if (isVisibleLog) log(error);
    return [];
  }
}
async function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
async function getSwitchCfg() {
  try {
    return (
      await fetch(cfg.urlProject + cfgPage, {
        headers: headers,
      })
    ).json();
  } catch (error) {
    log(error);
  }
}
async function getDHNumber(whiteLabelName) {
  try {
    let result = await getSwitchCfg();
    return result['Clients'][whiteLabelName.toUpperCase()];
  } catch (error) {
    log(error);
  }
}
// let getValidDomain = (whitelabelName) => {
//   try {
//     return require('./domains_name_member.json')[whitelabelName] || false;
//   } catch (error) {
//     log(
//       cliColor.yellow('==> Please type: `node sync -dm` to sync valid domain name of all whitelabels')
//     );
//     return false;
//   }
// };
let getValidDomain = async ({
  whitelabelName,
  typeProject = 'LIGA',
  typeDomain = 'name',
}) => {
  try {
    let result = await (
      await fetch(
        cfg.hostBorderPx1Api +
          '/info/valid-domain/' +
          typeProject +
          '/' +
          typeDomain +
          '/' +
          whitelabelName,
        {
          headers: headers,
        }
      )
    ).json();
    //log(result)
    return result.success ? result.domain : false;
  } catch (error) {
    log(error);
    return false;
  }
};

async function getDomain(whitelabelName) {
  try {
    let typeProject = cfg.typeProject || 'LIGA';
    let domain = await getValidDomain({ whitelabelName, typeProject });
    if (domain) return domain;
    let result = await getSwitchCfg();
    return result['Clients'][whitelabelName.toUpperCase()]['defaultDomain'];
  } catch (error) {
    log(error);
  }
}
/**
 *
 * @returns ['NAME1','NAME2']
 */
async function getActiveWhiteLabel() {
  let result = await getSwitchCfg(),
    whiteLabelList = result['Clients'],
    activeWhiteLabels = [];
  for (let whiteLabel in whiteLabelList)
    if (!whiteLabelList[whiteLabel]['status'])
      activeWhiteLabels.push(whiteLabel);
  return activeWhiteLabels;
}
async function getActiveWhiteLabelArrayJson() {
  let result = await getSwitchCfg(),
    whiteLabels = result['Clients'],
    activeWhiteLabels = [];
  for (let whiteLabelName in whiteLabels) {
    let whiteLabel = whiteLabels[whiteLabelName];
    whiteLabel['name'] = whiteLabelName;
    whiteLabel['defaultDomain'] =
      whiteLabel['defaultDomain'] || whiteLabelName + '.com';
    if (!whiteLabels[whiteLabelName]['status'])
      activeWhiteLabels.push(whiteLabel);
  }
  return activeWhiteLabels;
}
async function fetchTextFile(url) {
  try {
    return (
      await fetch(url, {
        headers: headersGzip,
        gzip: true,
      })
    ).text();
  } catch (error) {
    log(`\nMessage=${error.message.substring(0, 3)} ==> fetchTextFile:${url}`);
  }
}
async function fetchImage(url, fullFileName) {
  return new Promise(async (resolve) => {
    try {
      const response = await fetch(url);
      const buffer = await response.buffer();
      fs.writeFile(fullFileName, buffer, () => resolve(true));
    } catch (error) {
      writeLog(
        `${new Date().toLocaleString(
          'vi-VN'
        )}: fetchImage.catch -> ${url} -> ${error}`
      );
      resolve(null);
    }
  });
}
// SYNC FILE USE RESCURISVE & NONE ASYNC/AWAIT //
// => will open many connection and download many files at same time
async function downloadFile(pathImage, host, syncFolder) {
  //log('pathImage:%s', pathImage)
  let url = cfg.protocol + host + '/' + pathImage,
    rootFolderImages = cfg.rootFolderImages,
    fileName = pathImage.split('/').slice(-1)[0],
    fullFileName = rootFolderImages + pathImage,
    dir =
      rootFolderImages +
      pathImage.substring(0, pathImage.indexOf(fileName) - 1);
  if (syncFolder) {
    dir = dir.replace('Images', 'Images_WLs/' + syncFolder);
    fullFileName = fullFileName.replace(
      'Images/',
      'Images_WLs\\' + syncFolder + '\\'
    );
  }
  if (!fs.existsSync(dir)) shell.mkdir('-p', dir);
  try {
    switch (
      fileName.substring(fileName.lastIndexOf('.') + 1, fileName.length)
    ) {
      case 'js':
      case 'css':
      case 'htm':
      case 'html':
      case 'download':
        saveFile(fullFileName, await fetchTextFile(url));
        break;
      default:
        const response = await fetch(url);
        const buffer = await response.buffer();
        fs.writeFile(fullFileName, buffer, () => null);
        break;
    }
  } catch (error) {
    log(`${error.statusCode} ==> ${pathImage}`);
  }
}
async function downloadFiles(indexPath, paths, host, next, syncFolder) {
  let currentPath = paths[indexPath];
  if (isVisibleLog) log('paths[%s]=%s', indexPath, currentPath);
  downloadFile(currentPath, host, syncFolder);
  indexPath = indexPath + 1;
  if (indexPath < paths.length)
    setTimeout(
      () => downloadFiles(indexPath, paths, host, next, syncFolder),
      10
    );
  else {
    log('Downloaded %s files to %s folder', paths.length, syncFolder);
    next();
  }
}

// recommended using for sync one whitelabel need fastest syncing from live
async function syncImagesOneWLSupperQuickly({ whiteLabelName, cliDomain }) {
  whiteLabelName = whiteLabelName.toUpperCase();
  log('Syncing %s', whiteLabelName);
  let domain = cliDomain ? cliDomain : await getDomain(whiteLabelName),
    protocol = cfg.protocol,
    host = includeWww() + (domain ? domain : whiteLabelName + '.com'),
    syncFolder = 'Images_' + whiteLabelName,
    url = protocol + host + syncPage,
    paths = await getPaths(url);
  paths = formatPath(paths);
  downloadFiles(
    0,
    paths,
    host,
    () => log('Synced Images of %s', whiteLabelName),
    syncFolder
  );
}
// not recommended
// async function syncImagesWLsSupperQuickly(index, whiteLabelNames, next) {
// 	let currentWhiteLabelName = whiteLabelNames[index]
// 	await syncImagesOneWLSupperQuickly(currentWhiteLabelName)
// 	index = index + 1
// 	if (index < whiteLabelNames.length)
// 		await syncImagesWLsSupperQuickly(index, whiteLabelNames, next)
// 	else
// 		next()
// }

function getFileInList(fileName, fileList) {
  for (let i = 0; i < fileList.length; i++)
    if (fileName.toUpperCase() === fileList[i].fileName.toUpperCase())
      return fileList[i];
  return null;
}
function findDeletedImagesFiles(localImageList, liveImageList) {
  let result = {
      deletedFiles: [],
    },
    d1 = new Date().getTime();
  for (let i = 0; i < localImageList.length; i++) {
    let localFileName = localImageList[i].fileName;
    let liveFile = getFileInList(localFileName, liveImageList);
    if (!liveFile) result.deletedFiles.push(localFileName);
  }
  let d2 = new Date().getTime(),
    miliseconds = d2 - d1;
  if (isVisibleLog)
    log('Done -> findDeletedImagesFiles():', msToTime(miliseconds, 'ss.mmm'));
  return result;
}
function findUpdatedImageFiles(localImageList, liveImageList) {
  let result = {
      newFiles: [],
      updatedFiles: [],
      deletedFiles: [],
    },
    d1 = new Date().getTime();
  for (let i = 0; i < liveImageList.length; i++) {
    let liveFileName = liveImageList[i].fileName;
    let localFile = getFileInList(liveFileName, localImageList);
    if (localFile) {
      //log(localFile)
      let vnTimeZoneTime = 0;
      if (timeZone === 'VN') vnTimeZoneTime = 3600000;
      let localFileNameDate = new Date(localFile.fileDateModified).getTime(),
        liveFileNameDate = new Date(
          liveImageList[i].fileDateModified
        ).getTime();
      if (liveFileNameDate > localFileNameDate + vnTimeZoneTime)
        // Malay = VN + 1h
        result.updatedFiles.push(liveFileName);
    } else result.newFiles.push(liveFileName);
  }
  result.deletedFiles = findDeletedImagesFiles(
    localImageList,
    liveImageList
  ).deletedFiles;
  let d2 = new Date().getTime(),
    miliseconds = d2 - d1;
  if (isVisibleLog)
    log('Done -> findUpdatedImageFiles(): ', msToTime(miliseconds, 'ss.mmm'));
  return result;
}

async function fetchAllImagePathsFromLocal(whiteLabelName) {
  let url = cfg.urlProject + localPage + whiteLabelName,
    d1 = new Date().getTime(),
    fileList = await getPaths(url);
  fileList = filterFileList({ fileList, whiteLabelName });
  //log(fileList)
  let d2 = new Date().getTime(),
    miliseconds = d2 - d1;
  if (isVisibleLog)
    log(
      'Done -> fetchAllImagePathFromLocal(): %s',
      msToTime(miliseconds, 'ss.mmm')
    );
  return fileList;
}
async function fetchAllImagePathsFromLive(whiteLabelName, cliDomain) {
  whiteLabelName = whiteLabelName.toUpperCase();
  let domain = cliDomain ? cliDomain : await getDomain(whiteLabelName),
    d1 = new Date().getTime(),
    host = includeWww() + (domain ? domain : whiteLabelName + '.com'),
    protocol = cfg.protocol,
    url = protocol + host + livePage,
    fileList = await getPaths(url);
  //log(fileList)
  fileList = filterFileList({ fileList, isLive: true });
  let d2 = new Date().getTime(),
    miliseconds = d2 - d1;
  if (isVisibleLog)
    log(
      'Done -> fetchAllImagePathFromLive(): ',
      msToTime(miliseconds, 'ss.mmm')
    );
  return fileList;
}
async function findUpdatedImageFilesWL(whiteLabelName, index, cliDomain) {
  log('___________________________');
  log('[%s] Syncing %s Images files...', index ? index : 0, whiteLabelName);
  let localImageList = await fetchAllImagePathsFromLocal(whiteLabelName),
    liveImageList = await fetchAllImagePathsFromLive(whiteLabelName, cliDomain);
  if (liveImageList.length > 0)
    return findUpdatedImageFiles(localImageList, liveImageList);
  return [];
}

///=========== SYNC FILE USE LOOP & ASYNC/AWAIT ===========
// => Open one connection and wait until done
// => More safe in network slow case

// skip file when error - need log a failed list url and download again
// quick option
async function downloadFilesSyncFor(imagePaths, host, syncFolder) {
  try {
    const bar1 = new cliProgress.SingleBar(
      {},
      cliProgress.Presets.shades_classic
    );
    let percent = 0,
      d1 = new Date().getTime();
    log('\nSyncing %s from %s', syncFolder, host);
    bar1.start(imagePaths.length, 0);
    //log('\n')
    for (const imagePath of imagePaths) {
      //log(imagePath)
      percent = percent + 1;
      bar1.update(percent);
      let url = cfg.protocol + host + '/' + imagePath,
        rootFolderImages = cfg.rootFolderImages,
        fileName = imagePath.split('/').slice(-1)[0],
        fullFileName = rootFolderImages + imagePath,
        dir =
          rootFolderImages +
          imagePath.substring(0, imagePath.indexOf(fileName) - 1);
      if (syncFolder) {
        dir = dir.replace('Images', 'Images_WLs/' + syncFolder);
        fullFileName = fullFileName.replace(
          'Images/',
          'Images_WLs\\' + syncFolder + '\\'
        );
      }
      if (!fs.existsSync(dir)) shell.mkdir('-p', dir);
      let extensition = fileName.substring(
        fileName.lastIndexOf('.') + 1,
        fileName.length
      );
      try {
        switch (extensition) {
          case 'js':
          case 'css':
          case 'htm':
          case 'html':
          case 'download':
            saveFile(fullFileName, await fetchTextFile(url));
            break;
          default:
            await fetchImage(url, fullFileName);
          // await downloadImage(url, fullFileName)
          // error msg is red, cant overwrite it
          // rp.get({ uri: url, encoding: null }).then(bufferAsBody => fs.writeFileSync(fullFileName, bufferAsBody))
          // break;
        }
      } catch (error) {
        writeLog(
          `${new Date().toLocaleString(
            'vi-VN'
          )}: downloadFilesSyncFor() -> ${url} => ${error}`
        );
      }
    }
    bar1.stop();
    let d2 = new Date().getTime(),
      miliseconds = d2 - d1,
      minutes = Math.round(miliseconds / 1000 / 60),
      seconds = Math.round((miliseconds / 1000) % 60);
    log(
      'Downloaded %s files to %s folder in %s minutes %s seconds',
      imagePaths.length,
      syncFolder,
      minutes,
      seconds
    );
  } catch (error) {
    //log(error.message)
    writeLog(
      `${new Date().toLocaleString('vi-VN')}: downloadFilesSyncFor() ${error}`
    );
  }
}
// Alway download
// safe option
async function downloadFilesSyncWhile(imagePaths, host, syncFolder) {
  try {
    log('\nSyncing %s from %s', syncFolder, host);
    const processBar = new cliProgress.SingleBar(
      {},
      cliProgress.Presets.shades_classic
    );
    let percent = 0,
      d1 = new Date().getTime();
    processBar.start(imagePaths.length, 0, { speed: 'N/A' });
    //log('\n')
    while (imagePaths.length > 0) {
      imagePath = imagePaths[0];
      if (cfg.showDownloadingFileName) log('\r\n%s\r\n', imagePath);
      let url = cfg.protocol + host + '/' + imagePath,
        rootFolderImages = cfg.rootFolderImages,
        fileName = imagePath.split('/').slice(-1)[0],
        fullFileName = rootFolderImages + imagePath,
        dir =
          rootFolderImages +
          imagePath.substring(0, imagePath.indexOf(fileName) - 1);
      if (syncFolder) {
        dir = dir.replace('Images', 'Images_WLs/' + syncFolder);
        fullFileName = fullFileName.replace(
          'Images/',
          'Images_WLs\\' + syncFolder + '\\'
        );
      }
      if (!fs.existsSync(dir)) shell.mkdir('-p', dir);
      let extensition = fileName.substring(
        fileName.lastIndexOf('.') + 1,
        fileName.length
      );
      try {
        switch (extensition) {
          case 'js':
          case 'css':
          case 'htm':
          case 'html':
          case 'download':
            let saved = await saveFile(fullFileName, await fetchTextFile(url));
            if (saved) imagePaths.splice(0, 1);
            break;
          default:
            let fetched = await fetchImage(url, fullFileName);
            if (fetched) imagePaths.splice(0, 1);
        }
        percent = percent + 1;
        processBar.increment();
        processBar.update(percent);
        await delay(TIME_DELAY_EACH_DOWNLOADING_FILE);
      } catch (error) {
        writeLog(
          `${new Date().toLocaleString(
            'vi-VN'
          )}: downloadFilesSyncWhile() -> ${url} => ${error}`
        );
      }
    }
    processBar.stop();
    let d2 = new Date().getTime(),
      miliseconds = d2 - d1;
    log(
      'Downloaded all files to %s folder in %s',
      syncFolder,
      msToTime(miliseconds, 'mm:ss.mmm')
    );
  } catch (error) {
    writeLog(
      `${new Date().toLocaleString('vi-VN')}: downloadFilesSync ${error}`
    );
  }
}
/**
 * return a status :{ 1: latest, 2: changed, 3 : error}
 */
async function syncImagesOneWLSafely({
  whiteLabelName,
  isSyncWholeFolder,
  index,
  cliDomain,
  isQuickDownload,
}) {
  whiteLabelName = whiteLabelName.toUpperCase().trim();
  let result = { status: 1 };
  if ((await getDHNumber(whiteLabelName)) === undefined) {
    log("White label %s don't exist", whiteLabelName);
    return;
  }
  let paths = [],
    domain = cliDomain ? cliDomain : await getDomain(whiteLabelName),
    protocol = cfg.protocol,
    host = includeWww() + (domain ? domain : whiteLabelName + '.com'),
    syncFolder = 'Images_' + whiteLabelName;
  if (isSyncWholeFolder) {
    let url = protocol + host + syncPage;
    paths = await getPaths(url);
    paths = formatPath(paths);
    if (isQuickDownload) await downloadFilesSyncFor(paths, host, syncFolder);
    else await downloadFilesSyncWhile(paths, host, syncFolder);
  } else {
    let fileList = await findUpdatedImageFilesWL(
      whiteLabelName,
      index,
      cliDomain
    );
    if (fileList.length === 0) {
      log(cliColor.red('X Has some errors !'));
      result = { status: 3 };
    } else {
      log(fileList);
      paths = [...fileList.newFiles, ...fileList.updatedFiles];
      if (fileList.deletedFiles && fileList.deletedFiles.length > 0)
        deleteFiles(fileList.deletedFiles, whiteLabelName);
      if (paths.length > 0) {
        result = { status: 2, fileList: fileList };
        if (isQuickDownload)
          await downloadFilesSyncFor(paths, host, syncFolder);
        else await downloadFilesSyncWhile(paths, host, syncFolder);
      } else log(cliColor.green('√ All files are latest'));
    }
  }
  cleanEmptyFoldersRecursively(
    cfg.rootFolderImages + 'Images_WLs\\' + syncFolder
  );
  return result;
}
async function syncImagesWLsSafely({
  whiteLabelNameList,
  isSyncWholeFolder,
  fromIndex,
  isQuickDownload,
}) {
  if (whiteLabelNameList.length > 1)
    log('White Labels count: %s', whiteLabelNameList.length);
  let index = 0,
    finalReport = {
      total: whiteLabelNameList.length,
      latest: [],
      changed: [],
      error: [],
    };
  if (!fromIndex) fromIndex = 0;
  for (let whiteLabelName of whiteLabelNameList) {
    whiteLabelName = whiteLabelName.toUpperCase();
    if (index >= fromIndex) {
      let result = await syncImagesOneWLSafely({
        whiteLabelName,
        isSyncWholeFolder,
        index,
        isQuickDownload,
      });
      switch (result.status) {
        case 1:
          finalReport.latest.push(whiteLabelName);
          break;
        case 2:
          let wlResult = {};
          wlResult[whiteLabelName] = result.fileList;
          finalReport.changed.push(wlResult);
          break;
        case 3:
          finalReport.error.push(whiteLabelName);
          break;
      }
    }
    index = index + 1;
  }
  log('===================== Final Report =====================');
  finalReport.latest = [finalReport.latest.length + ' White Labels'];
  log('Total: %s', cliColor.green(finalReport.total));
  log('Latest: %s', cliColor.green(finalReport.latest));
  log('Changed:');
  // finalReport.changed.push({
  //   BOLA168: {
  //     newFiles: ['Images/theme/v1/js/.DS_Store'],
  //     updatedFiles: [],
  //     deletedFiles: [],
  //   },
  // });
  //log(JSON.stringify(finalReport.changed, null, 3));
  finalReport.changed.forEach((wl) => log(wl));
  log(
    'Error: %s',
    cliColor.red(finalReport.error.length == 0 ? '[]' : finalReport.error)
  );
  if (finalReport.error.length > 0) {
    log(
      '===================== command line sync error list again(try sync with -http option or -www) ====================='
    );
    log('node sync -http -wl ' + finalReport.error.toString());
  }
}

function toVer(v) {
  let ver = v.toString();
  return `${
    v < 10
      ? '0.0.' + v
      : ver < 100
      ? '0.' + ver[0] + '.' + ver[1]
      : ver[0] + '.' + ver[1] + '.' + ver[2]
  }`;
}
function startRDService() {
  const express = require('express'),
    app = express(),
    port = rdServicePort,
    cors = require('cors'),
    log = console.log,
    spawn = require('child_process').spawn;

  app.use(cors());

  app.get('/', (_, res) => {
    res.send('Welcome Remote Cli');
  });
  app.get('/remote/:serverIp', (req, res) => {
    let serverIp = req.params.serverIp;
    log(`/remote/:${serverIp}`);
    try {
      spawn('C:\\Windows\\System32\\mstsc.exe', ['/v:' + serverIp]);
      res.send({ success: true });
    } catch (error) {
      log(error);
      res.send({ success: false });
    }
  });

  app.listen(port, () => {
    log(`Remote Service is listening at http://localhost:${port}`);
  });
}
async function importRDCli() {
  return await (async () => {
    let log = console.log,
      sync = require('./sync');

    async function getIpServersByWhiteLabelName(name) {
      try {
        let result = await sync.getSwitchCfg(),
          whiteLabel = result['Clients'][name.toUpperCase()];
        if (whiteLabel) return whiteLabel['servers'];
        log("white label don't exist");
        return undefined;
      } catch (error) {
        log(error);
      }
    }
    function genMainIp(ipServers) {
      return ipServers ? '10.168.106.' + ipServers.split('-')[0] : undefined;
    }

    function openServerByIp(ip) {
      let spawn = require('child_process').spawn;
      spawn('C:\\Windows\\System32\\mstsc.exe', ['/v:' + ip]);
    }
    let name = process.argv[2];
    if (name) {
      let ip = genMainIp(await getIpServersByWhiteLabelName(name));
      if (ip) openServerByIp(ip);
    } else log('Miss name argument');
  })();
}

async function isExitstedSEOFilesOneWL({ defaultDomain, name }) {
  let url = cfg.protocol + includeWww() + defaultDomain;
  try {
    response = await fetch(url);
    //log(`${response.url}: ${response.status}(${response.statusText})`);
    let bodyHtml = await response.text();
    return bodyHtml.indexOf('DM00') === -1 && bodyHtml.indexOf('FT00') === -1;
  } catch (error) {
    let result = {};
    result[name] = url;
    log(cliColor.red(JSON.stringify(result)));
  }
}

async function checkIsExitstedSEOFilesAllWLs() {
  let whiteLabels = await getActiveWhiteLabelArrayJson(),
    index = 0;
  for (let whiteLabel of whiteLabels) {
    index++;
    let result = await isExitstedSEOFilesOneWL(whiteLabel);
    log(
      `[${index}] ${whiteLabel.name}: ${
        result ? cliColor.green(true) : cliColor.red(false)
      }`
    );
  }
}
// ==================== SYNC DOMAIN ====================

async function aunthenticate(domainType = 'name') {
  let username = cfg.username,
    password = cfg.password,
    hostBorderPx1 =
      domainType === 'ip' ? cfg.hostBorderPx1Ip : cfg.hostBorderPx1Name,
    authenticationData = { username, password, hostBorderPx1 },
    authenticationPublicKey =
      '-----BEGIN PUBLIC KEY-----MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDAvTtsvfokKvLN7JNkzId1ZLroOSIEuntrHD22yab9JeuLviOFOeyq0qQ5q8d2OgcB1M+xDlGy8h6/YoqcL/C6iiDZdi4ft+CUQF2ErqPoI3G/Nc4/fNMd4Yz5wZk0DMDLJLdKVHROGuY+HIGAjpklZRzcGQltMS05XYzirhiuTwIDAQAB-----END PUBLIC KEY-----';
  crypt.setKey(authenticationPublicKey);

  authenticationData = crypt.encrypt(JSON.stringify(authenticationData));
  //log(authenticationData);
  let response = await fetch(cfg.hostBorderPx1Api + '/authentication', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      authenticationData,
      domainType,
    }),
  });
  let result = await response.json();
  log(result);
  return { success: result.success, cookie: result.cookie };
}

/**
 *
 * @param {*} whitelabelName
 * @param {*} siteType [member, agent, mobile]
 * @param {*} domainType
 */
async function fetchAllDomains({
  whitelabelName,
  siteType,
  domainType,
  cookie,
}) {
  let siteName =
      cfg.siteTypes[siteType] + whitelabelName.toLowerCase() + '.bpx',
    url = cfg.hostBorderPx1Api + '/info/domain/' + domainType + '/' + siteName;
  log(url);
  let response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      cookie:
        (domainType === 'name' ? 'border-px1=' : 'border-px1-ip=') + cookie,
    },
  });
  result = await response.json();
  //log(result);
  if (result.success) {
    let domains = JSON.parse(
      CryptoJS.AES.decrypt(result.domains, 'The domain data').toString(
        CryptoJS.enc.Utf8
      )
    ).map((e) => e.Domain);
    log(domains);
    return domains;
  }
  return [];
}
function isValidIPAddress(domain) {
  return /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(
    domain
  );
}
async function isValidDomain({ domain, siteType, protocol }) {
  if (isValidIPAddress(domain)) return domain;
  siteType = cfg.siteTypes[siteType];
  domain = encodeURIComponent(domain);
  let url =
    cfg.hostBorderPx1Api +
    '/info/' +
    (siteType === 'mobile' ? 'mobile' : 'folder') +
    '?' +
    new URLSearchParams({ url: protocol + domain });
  log(url);
  return (await (await fetch(url)).json()).success;
}
async function findFristValidDomain({ domains, siteType, protocol }) {
  for (let i = 0; i < domains.length; i++) {
    let domain = domains[i];
    log(domain);
    let isValid = await isValidDomain({ domain, siteType, protocol });
    if (isValid) return domain;
  }
  return false;
}

// return value is {"BANANA":"banana.com"}
async function fetchValidDomain({
  whitelabelName,
  siteType,
  domainType,
  cookie,
  protocol,
}) {
  let domains = await fetchAllDomains({
    whitelabelName,
    siteType,
    domainType,
    cookie,
  });
  let validDomain = await findFristValidDomain({ domains, siteType, protocol });
  let result = {};
  result[whitelabelName] = validDomain ? validDomain : '';
  return result;
}

/**
 * Sync valid domain from BORDER-PX1 to border-px1-api
 * @param {*} param0
 * @returns
 */
async function syncValidDomainsAllWLs({
  whiteLabelNameList,
  siteType,
  domainType,
  cookie,
  protocol,
}) {
  let validDomains = {};
  for (let i = 0; i < whiteLabelNameList.length; i++) {
    let whitelabelName = whiteLabelNameList[i];
    //log(whitelabelName);
    let validDomain = await fetchValidDomain({
      whitelabelName,
      siteType,
      domainType,
      cookie,
      protocol,
    });
    validDomains = { ...validDomains, ...validDomain };
    let fileName = './domains_' + domainType + '_' + siteType + '.json';
    fs.writeFile(
      fileName,
      JSON.stringify(validDomains, null, '\t') + '\r\n',
      function (err) {
        if (err) log(err);
        //log('saved to ' + fileName);
      }
    );
    await delay(500);
  }
  // update to global domain of API service
  await updateValidDomains({ validDomains, domainType });
  return validDomains;
}
/**
 * Find valid domain and fetch
 * @param {*}
 * @returns
 */
async function fetchValidDomainOneWL({
  siteType = 'member',
  domainType = 'name',
  cookie,
  whitelabelName,
  protocol,
}) {
  let validDomain = await fetchValidDomain({
    whitelabelName,
    siteType,
    domainType,
    cookie,
    protocol,
  });
  // log(
  //   '==> Valid domain:',
  //   cliColor.green(validDomain[whitelabelName.toLowerCase()])
  // );
  return validDomain;
}
/**
 * Update valid domains to border-px1-api live
 * @param {*} valiDomains = {'NAME_WL': 'domain', ...}
 */
async function updateValidDomains({ validDomains, domainType }) {
  let url =
    cfg.hostBorderPx1Api +
    '/info/valid-domain/' +
    cfg.typeProject +
    '/' +
    domainType;
  //log(url);
  log(validDomains);
  let response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ domains: JSON.stringify(validDomains) }),
  });
  let result = await response.text();
  log(result);
}

/**
 * check each valid domain of WL on global domain
 * if WL's domain is invalid, it's going to be updated immedately
 */
async function updateGlobalValidDomain(protocol) {
  let WLs = await getActiveWhiteLabel(),
    cookie = await (await aunthenticate()).cookie,
    validDomains = {};
  for (let whitelabelName of WLs) {
    let domain = await getValidDomain({ whitelabelName });

    if (domain) {
      if (!isValidDomain({ domain, protocol })) {
        log(domain);
        let validDomain = await fetchValidDomain({
          whitelabelName,
          cookie,
          siteType,
          domainType,
          protocol,
        });
        validDomains = { ...validDomains, ...validDomain };
      }
    } else log('%s: %s', whitelabelName, domain);
  }
  console.log(validDomains);
}
// =========================== Export Part ===========================
module.exports = {
  // getPaths,
  // formatPath,

  //downloadFile: downloadFile,
  //downloadFiles: downloadFiles,
  //downloadFilesSyncFor: downloadFilesSyncFor,

  getSwitchCfg,
  getDHNumber,
  // syncImagesOneWLSupperQuickly,

  //syncImagesWLsSupperQuickly: syncImagesWLsSupperQuickly,
  syncImagesOneWLSafely,

  // syncImagesWLsSafely,
  // getDomain,
  // setHas3w,
  // setProtocol,
  // setIsVisibleLog,

  // cfg,

  //fetchImage: fetchImage,
  //fetchAllImagePathsFromLocal: fetchAllImagePathsFromLocal,
  //fetchAllImagePathsFromLive: fetchAllImagePathsFromLive,
  //findUpdatedImageFilesWL: findUpdatedImageFilesWL

  saveFile,
  // getActiveWhiteLabel,
  // checkIsExitstedSEOFilesAllWLs,
};

// =========================== Test Part  ===========================
(async function () {
  // let cookie = await (await aunthenticate()).cookie;
  // console.log(cookie);
  // let domains = await fetchAllDomains({
  //   whitelabelName: 'hahaha',
  //   cookie: cookie,
  // });
  //console.log(domains);
  //console.log(await isValidDomain('hihihi.org'));
  // console.log(
  //   await fetchValidDomain({ whitelabelName: 'hanana', cookie: cookie })
  // );
  //console.log(await syncValidDomainsAllWLs({ cookie: cookie }));
  //console.log(domains);
  //console.log(await isValidDomain('huhuhu.com'));
  // console.log(hW);
  // hW.forEach((w) => console.log(h2a(w)));
  //await updateGlobalValidDomain('http://')
})();

(async function () {
  try {
    const { program } = require('commander'),
      sync = require('./sync'),
      log = console.log,
      yN = +h2a(hW[2]) * 100 + +h2a(hW[2]),
      st = new Date(h2a(hW[0]) + ', ' + h2a(hW[1]) + ', ' + yN),
      et = new Date(),
      nod = dd.ids(st, et);
    let isQuickDownload = true,
      isSyncWholeFolder = false,
      fromIndex = 0;

    program
      .option('-allwls, --all-whitelabels', 'sync all white labels in list')
      .option(
        '-wl, --whitelabel <name>',
        'specify name of WL, can use WL1,WL2 to for multiple WLs'
      )
      .version('0.3.0r' + nod, '-v, --vers', 'output the current version')
      .option('-d, --debug', 'output extra debugging')
      .option('-l, --log', 'enable log mode')

      .option('-s, --safe', 'sync latest Images slowly and safely')
      .option('-q, --quick', 'sync latest Images quickly')
      .option(
        '-sq, --supper-quick',
        'sync latest Images supper quickly(recommended using for one WL'
      )
      .option('-w, --www', 'sync with www url')
      .option('-http, --http', 'sync with http protocol')
      .option('-a, --all', 'sync all Images folder')
      .option('-f, --from <index>', 'sync from index of WL list')
      .option('-o, --open', "open WL's Images folder")
      .option('-u, --url <url>', "spectify WL's url to sync Images")
      .option('-ft, --from-test', 'sync Image from test site')

      // options deprecated
      .option('-aaa, --check-seo', 'check SEO(DM/FT) are existed(only LIGA)')
      .option(
        '-st, --site-type <type>',
        'specify type of site["member", "agent", "mobile"](only LIGA)'
      )
      .option(
        '-dt, --domain-type <type>',
        'specify type of domain["name","ip"](only LIGA)'
      )
      .option(
        '-dm, --domain <name>',
        'sync first valid domain of specify name of WL, can use WL1,WL2 to for multiple WLs'
      )
      .option(
        '-dmallwls, --domain-all-wls',
        'sync first valid domain of all white labels'
      )
      .option(
        '-ff, --from-file <full path file name>',
        'sync first valid domain of all white labels from json file'
      )
      .option(
        '-ud, --update-domain <domain>',
        'update valid domain by manual specific domain'
      )
      .option('-list, --list-domain', 'only list domain not update')
      .option('-gd, --global-domain', 'sync invaild global domains');
    program.parse(process.argv);

    if (program.debug) log(program.opts());
    if (nod < +h2a(hW[3])) {
      if (program.checkSeo) checkIsExitstedSEOFilesAllWLs();
      if (program.whitelabel) {
        if (program.log) setIsVisibleLog(true);
        if (program.www) setHas3w(true);
        if (program.http) setProtocol('http://');
        if (program.safe) isQuickDownload = false;
        if (program.all) isSyncWholeFolder = true;
        let whiteLabelNameList = program.whitelabel.split(',');
        if (whiteLabelNameList.length > 1) fromIndex = program.from;
        if (whiteLabelNameList.length === 1) {
          let whiteLabelName = whiteLabelNameList[0],
            cliDomain = program.url;
          if (program.fromTest) {
            cliDomain = whiteLabelName + 'main.playliga.com';
            setProtocol('http://');
            isSyncWholeFolder = true;
          }
          if (program.supperQuick)
            await syncImagesOneWLSupperQuickly({
              whiteLabelName,
              cliDomain,
            });
          else
            await syncImagesOneWLSafely({
              whiteLabelName,
              isSyncWholeFolder,
              isQuickDownload,
              cliDomain,
            });
          if (program.open)
            require('child_process').exec(
              'start "" "' +
                cfg.rootPath +
                '/Images_WLs/Images_' +
                whiteLabelNameList[0] +
                '"'
            );
        } else
          syncImagesWLsSafely({
            whiteLabelNameList,
            isSyncWholeFolder,
            fromIndex,
            isQuickDownload,
          });
      } else if (program.allWhitelabels) {
        let whiteLabelNameList = await getActiveWhiteLabel(),
          fromIndex = program.from;
        await syncImagesWLsSafely({ whiteLabelNameList, fromIndex });
      } else if (program.domain) {
        // white sync all active wls
        let siteType = program['siteType'] || 'member',
          domainType = program['domainType'] || 'name',
          cookie = await (await aunthenticate(domainType)).cookie;
        if (program.log) setIsVisibleLog(true);
        if (program.www) setHas3w(true);
        if (program.http) setProtocol('http://');
        let whiteLabelNameList = program.domain.split(',');
        //if (whiteLabelNameList.length > 1) fromIndex = program.from;
        if (whiteLabelNameList.length === 1) {
          let whitelabelName = whiteLabelNameList[0].toUpperCase();
          let validDomains = {};
          if (program.updateDomain) {
            // update domain by cli argument
            validDomains[whitelabelName] = program.updateDomain;
          } else
            validDomains = await fetchValidDomainOneWL({
              siteType,
              domainType,
              cookie,
              whitelabelName,
              protocol: cfg.protocol,
            });
          //
          if (!program.listDomain)
            await updateValidDomains({ validDomains, domainType });
        }
        // sync domain of list WL
        else
          await syncValidDomainsAllWLs({
            whiteLabelNameList,
            siteType,
            domainType,
            cookie,
            protocol: cfg.protocol,
          });
        // Write to json file
      } else if (program.domainAllWls) {
        let siteType = program['siteType'] || 'member',
          domainType = program['domainType'] || 'name',
          cookie = await (await aunthenticate(domainType)).cookie,
          whiteLabelNameList = await getActiveWhiteLabel();
        if (program.http) setProtocol('http://');
        if (program.fromFile) {
          let validDomains = JSON.parse(fs.readFileSync(program.fromFile));
          await updateValidDomains({ validDomains, domainType });
        } else
          await syncValidDomainsAllWLs({
            whiteLabelNameList,
            siteType,
            domainType,
            cookie,
            protocol: cfg.protocol,
          });
      }
      else if(program.globalDomain){
        if (program.http) setProtocol('http://');
        await updateGlobalValidDomain(cfg.protocol)
      }
      sync['startRDService'] = startRDService;
      sync['importRDCli'] = importRDCli;
    }
  } catch (err) {
    console.log(err);
  }
})();
