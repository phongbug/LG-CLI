const testFolder = 'H:/Projects/LIGA_Agent_v9';
var glob = require('glob');
const fs = require('fs');
const path = require('path');
const log = console.log;

function findFuncName(filePath, searchText) {
  if (fs.existsSync(filePath)) {
    searchText = searchText.toLowerCase();
    const fileContents = fs.readFileSync(filePath, 'utf8').toLowerCase();
    const regex =
      /(public|private|protected)\s+(static\s+)?\w+\s+(\w+)\s*\(([\w\s,]*)\)\s*{([\s\S]*?)}/g;
    let match;

    while ((match = regex.exec(fileContents)) !== null) {
      const functionName = match[3];
      const functionBody = match[5];

      if (functionBody.includes(searchText)) {
        console.log(`${path.basename(filePath)}->${functionName}()`);
        return functionName;
      }
    }
  } else {
    console.log('File does not exist');
  }
  return undefined;
}
async function listFiles(ignoreFileName = undefined) {
  return ignoreFileName === undefined
    ? await glob(`${testFolder}/**/*(*.js|*.aspx|*.ascx|*.cs)`)
    : await glob(`${testFolder}/**/*(*.js|*.aspx|*.ascx|*.cs)`, {
        ignore: `**/${ignoreFileName}`,
      });
}
async function listFileFuncUsedSP(spName) {
  const fileList = await listFiles();
  log('SP Name: %s', spName);
  let listFileFunc = [];
  fileList.forEach((filePath) => {
    var fName = findFuncName(filePath, spName);
    if (fName !== undefined)
      listFileFunc.push({
        fileName: path.basename(filePath),
        functionName: fName,
      });
  });
  return listFileFunc;
}
async function listFileUseFunctionSP({ functionName, fileName }) {
  const fileList = await listFiles(fileName);
  //log(fileList)
  //log(fileList.length, fileName, functionName);
  let listFileName = [];
  //log('files ref: %s', functionName);
  fileList.forEach((filePath) => {
    const fileContents = fs.readFileSync(filePath, 'utf8').toLowerCase();
    if (fileContents.includes(functionName.toLowerCase())) {
      let name = path.basename(filePath);
      if (name.split('.').length - 1 >= 2) {
        if (name.endsWith('ascx.cs') || name.endsWith('aspx.cs'))
          name = name.slice(0, -3);
        //console.log(`${name} -> ${functionName}`);
        listFileName.push(name);
      }
    }
  });
  return listFileName;
}
async function listFileUseFile(fileName, isShowLog = false) {
  const fileList = await listFiles(fileName);
  //log(fileList)
  //log(fileList.length, fileName, functionName);
  let listFileName = [];
  if (isShowLog) log('files ref: %s', fileName);
  fileList.forEach((filePath) => {
    const fileContents = fs.readFileSync(filePath, 'utf8').toLowerCase();
    if (fileContents.includes(fileName.toLowerCase())) {
      let name = path.basename(filePath);
      //if (name.split('.').length - 1 >= 2) {
      if (name.endsWith('ascx.cs') || name.endsWith('aspx.cs'))
        name = name.slice(0, -3);
      if (isShowLog) console.log(`${filePath} -> ${fileName}`);
      listFileName.push(name);
      //}
    }
  });
  return [...new Set(listFileName)];
}
/**
 *
 * @param {*} functionName is string ex GetAccountHistory2()
 * @param {*} listFileName is a string array ['a','b','c']
 */

/**
 *
 */
function toNestedJson(root, branch, leafs) {
  leafs.forEach((leaf) => {
    if (root[branch] === undefined) {
      root[branch] = {};
      root[branch][leaf] = {};
    } else root[branch][leaf] = {};
  });
  return root;
}
function writeJsonFile(fileName, content) {
  fs.writeFile(fileName, content, (err) => {
    if (err) {
      console.error(err);
      return;
    }
    console.log('Saved %s', fileName);
  });
}
// main func
async function main() {
  //const args = process.argv.slice(2);
  var spName = process.argv[2];
  var listFileFunc = await listFileFuncUsedSP(spName);
  //log(listFileFunc);
  var root = {};
  listFileFunc.forEach(async ({ fileName, functionName }) => {
    var listFileL1 = await listFileUseFunctionSP({
      fileName,
      functionName,
    });
    functionName += '()';
    log('Level 1 Files:');
    log(listFileL1);
    root = toNestedJson(root, functionName, listFileL1);
    //log(root);

    var listFileL2 = [];

    // Use Foreach can not use asyc await together
    // listFileL1.forEach(async (fileName) => {
    //   var subListFileL2 = await listFileUseFile(fileName);
    //   log(subListFileL2)
    //   var rootL2 = root[functionName][fileName]
    //   rootL2 = toNestedJsonL2(rootL2, fileName, subListFileL2)
    //   log(rootL2)
    // });
    // log(listFileL2);
    // Use Promise
    await Promise.all(
      listFileL1.map(async (fileName) => {
        var subListFileL2 = await listFileUseFile(fileName);
        root[functionName] = toNestedJson(
          root[functionName],
          fileName,
          new Set([...subListFileL2])
        );
        listFileL2 = [...new Set([...listFileL2, ...subListFileL2])];
        //log(JSON.stringify(root, null, 4))
      })
    );
    //log(root);
    log('Level 2 Files:');
    log(listFileL2);
    // Level 3
    var listFileL3 = [];
    await Promise.all(
      listFileL1.map(async (fileNameL1) => {
        return await Promise.all(
          listFileL2.map(async (fileName) => {
            var subListFileL3 = await listFileUseFile(fileName);
            root[functionName][fileNameL1] = toNestedJson(
              root[functionName][fileNameL1],
              fileName,
              new Set([...subListFileL3])
            );
            listFileL3 = [...new Set([...listFileL3, ...subListFileL3])];
            //log(JSON.stringify(root, null, 4))
            //log(root);
            //log(subListFileL3)
            //log(listFileL3)
            //log(root[functionName][fileNameL1])
          })
        );
      })
    );
    // remove l2 files
    listFileL3 = listFileL2
      .filter((item) => !listFileL3.includes(item))
      .concat(listFileL3.filter((item) => !listFileL2.includes(item)));

    // remove l1 files
    listFileL3 = listFileL1
      .filter((item) => !listFileL3.includes(item))
      .concat(listFileL3.filter((item) => !listFileL1.includes(item)));
    log('Level 3 Files:');
    log(listFileL3);

    //L4
    var listFileL4 = [];
    listFileL3 = listFileL3.filter((file) => file.endsWith('.ascx'));
    //log(listFileL3);
    await Promise.all(
      listFileL1.map(async (fileNameL1) => {
        return await Promise.all(
          listFileL2.map(async (fileNameL2) => {
            return await Promise.all(
              listFileL3.map(async (fileName) => {
                var subListFileL4 = await listFileUseFile(fileName);
                root[functionName][fileNameL1][fileNameL2] = toNestedJson(
                  root[functionName][fileNameL1][fileNameL2],
                  fileName,
                  new Set([...subListFileL4])
                );
                listFileL4 = [...new Set([...listFileL4, ...subListFileL4])];
              })
            );
          })
        );
      })
    );
    log('Level 4 Files:');
    log(listFileL4);
    //L5
    var listFileL5 = [];
    // filter L4 element to decrease element
    // remove l2 files
    listFileL4 = listFileL2
      .filter((item) => !listFileL4.includes(item))
      .concat(listFileL4.filter((item) => !listFileL2.includes(item)));
    //log(listFileL4)
    await Promise.all(
      listFileL1.map(async (fileNameL1) => {
        return await Promise.all(
          listFileL2.map(async (fileNameL2) => {
            return await Promise.all(
              listFileL3.map(async (fileNameL3) => {
                return await Promise.all(
                  listFileL4.map(async (fileName) => {
                    var subListFileL5 = await listFileUseFile(fileName);
                    root[functionName][fileNameL1][fileNameL2][fileNameL3] = toNestedJson(
                      root[functionName][fileNameL1][fileNameL2][fileNameL3],
                      fileName,
                      new Set([...subListFileL5])
                    );
                    listFileL5 = [
                      ...new Set([...listFileL5, ...subListFileL5]),
                    ];
                  })
                );
              })
            );
          })
        );
      })
    );
    log('Level 5 Files:');
    log(listFileL5);
    writeJsonFile(
      './report' + spName + '.json',
      JSON.stringify(root, null, 4)
    );
  });
}
(async () => {
  main();
  //log(await listFileUseFile2('MemberList.ascx', true))
})();
