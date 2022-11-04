export type Platform =
  | 'LinuxAmd64Snap'
  | 'LinuxAmd64Deb'
  | 'LinuxArm64AppImage'
  | 'LinuxArm64Deb'
  | 'LinuxI386AppImage'
  | 'LinuxI386Deb'
  | 'LinuxX86_64AppImage'
  | 'MacArm64Dmg'
  | 'MacArm64Zip'
  | 'MacX64Dmg'
  | 'MacX64Zip'
  | 'WinIa32Exe'
  | 'WinX64Exe'
  | 'WinExe'

export type Package = '@standardnotes/mobile' | '@standardnotes/desktop' | '@standardnotes/web'

export type Versions = Record<Package, string>
export type Downloads = Record<Platform, string>
