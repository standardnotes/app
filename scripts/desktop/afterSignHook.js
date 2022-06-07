/** @see: https://medium.com/@TwitterArchiveEraser/notarize-electron-apps-7a5f988406db */

const fs = require('fs');
const path = require('path');
const electronNotarize = require('electron-notarize');

module.exports = async function (params) {
  const platformName = params.electronPlatformName;
  // Only notarize the app on macOS.
  if (platformName !== 'darwin') {
    return;
  }
  console.log('afterSign hook triggered');

  const { appId } = JSON.parse(await fs.promises.readFile('../../packages/desktop/package.json')).build;

  const appPath = path.join(params.appOutDir, `${params.packager.appInfo.productFilename}.app`);
  await fs.promises.access(appPath);

  console.log(`Notarizing ${appId} found at ${appPath}`);

  try {
    electronNotarize
      .notarize({
        appBundleId: appId,
        appPath: appPath,
        appleId: process.env.notarizeAppleId,
        appleIdPassword: process.env.notarizeAppleIdPassword,
      })
      .then(() => {
        console.log(`Done notarizing ${appId}`);
      });
  } catch (error) {
    console.error(error);
    throw error;
  }
};
