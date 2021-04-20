const JSEncrypt = require('node-jsencrypt'),
  crypt = new JSEncrypt();
function generateTokenFetchFile(dayQuantity = 1) {
  console.log('Quantity of day token will be expired:');
  console.log(dayQuantity)
  let today = new Date();
  let expriredDate = new Date();
  expriredDate.setDate(today.getDate() + dayQuantity);
  expriredDate = {
    y: expriredDate.getFullYear(),
    m: expriredDate.getMonth() + 1,
    d: expriredDate.getDate(),
  };
  console.log('Exprired date:');
  console.log(expriredDate)
  var publicKey = `-----BEGIN PUBLIC KEY-----
      MIGeMA0GCSqGSIb3DQEBAQUAA4GMADCBiAKBgG0mOrhrYDdaKFugucBSiyWODeiz
      uASppuxKtrbS6IgbUvB3265vHVeRdPMRMLMoYFwCdXdbyMJ+nlsUdYx9ruhkuUnv
      fhmKxD6KisUMZ1RCyRANECeeF3tUFtkF05UMFbFq6X0UStWpzWYiqt47gm0wp1sG
      MAqF5NvqfkfBNN5HAgMBAAE=
      -----END PUBLIC KEY-----`;
  crypt.setKey(publicKey);
  let token = crypt.encrypt(JSON.stringify(expriredDate));
  return token;
}
(() => {
  let q = process.argv[2] || 1;
  console.log(generateTokenFetchFile(+q));
})();
