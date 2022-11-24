import Desktop from '../../desktop/package.json' assert { type: 'json' }
import Mobile from '../../mobile/package.json' assert { type: 'json' }
import Web from '../../web/package.json' assert { type: 'json' }
import { writeJson, ensureDirExists } from '../../../scripts/ScriptUtils.mjs'

const CdnUrl = 'https://github.com/standardnotes/app/releases/download/'
const DesktopPackageName = '@standardnotes/desktop'
const DesktopVersion = Web.version
const BaseFileName = `standard-notes-${DesktopVersion}`
const ReleaseUrl = `${CdnUrl}${DesktopPackageName}@${DesktopVersion}/${BaseFileName}`.replaceAll('@', '%40')

const Versions = {
  [Desktop.name]: Web.version,
  [Mobile.name]: Web.version,
  [Web.name]: Web.version,
}

const Downloads = {
  LinuxAmd64Snap: `${ReleaseUrl}-linux-amd64.snap`,
  LinuxAmd64Deb: `${ReleaseUrl}-linux-amd64.deb`,
  LinuxArm64AppImage: `${ReleaseUrl}-linux-arm64.AppImage`,
  LinuxArm64Deb: `${ReleaseUrl}-linux-arm64.deb`,
  LinuxI386AppImage: `${ReleaseUrl}-linux-i386.AppImage`,
  LinuxI386Deb: `${ReleaseUrl}-linux-i386.deb`,
  LinuxX86_64AppImage: `${ReleaseUrl}-linux-x86_64.AppImage`,
  MacArm64Dmg: `${ReleaseUrl}-mac-arm64.dmg`,
  MacArm64Zip: `${ReleaseUrl}-mac-arm64.zip`,
  MacX64Dmg: `${ReleaseUrl}-mac-x64.dmg`,
  MacX64Zip: `${ReleaseUrl}-mac-x64.zip`,
  WinIa32Exe: `${ReleaseUrl}-win-ia32.exe`,
  WinX64Exe: `${ReleaseUrl}-win-x64.exe`,
  WinExe: `${ReleaseUrl}-win.exe`,
  AppStoreiOS: 'https://itunes.apple.com/us/app/standard-notes/id1285392450?mt=8',
  GooglePlay: 'https://play.google.com/store/apps/details?id=com.standardnotes',
  WebApp: 'https://app.standardnotes.com',
}

ensureDirExists('dist')
writeJson({ Versions, Downloads }, 'dist/releases.json')
