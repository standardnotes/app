import Components from '../../components/package.json' assert { type: 'json' }
import Desktop from '../../desktop/package.json' assert { type: 'json' }
import Mobile from '../../mobile/package.json' assert { type: 'json' }
import Web from '../../web/package.json' assert { type: 'json' }
import { writeJson, ensureDirExists } from '../../../scripts/ScriptUtils.mjs'

const CdnUrl = 'https://github.com/standardnotes/app/releases/download/'
const DesktopPackageName = '@standardnotes/desktop'
const DesktopVersion = Desktop.version
const BaseFileName = `standard-notes-${DesktopVersion}`
const ReleaseUrl = `${CdnUrl}${DesktopPackageName}@${DesktopVersion}/${BaseFileName}`.replaceAll('@', '%40')

const Versions = {
  [Components.name]: Components.version,
  [Desktop.name]: Desktop.version,
  [Mobile.name]: Mobile.version,
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
}

ensureDirExists('dist')
writeJson({ Versions, Downloads }, 'dist/releases.json')
