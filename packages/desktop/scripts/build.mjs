import path from 'path'
import { fileURLToPath } from 'url'
import { Command } from './Command.mjs'
import { publishSnap } from './publishSnap.mjs'
import { runCommand } from './runCommand.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const RootDir = path.join(__dirname, '../../..')
export const DesktopDir = path.join(__dirname, '../')
const ScriptsDir = path.join(__dirname)

async function buildTargets(targets) {
  console.log('Building targets: ', targets)

  await runCommand(Command('yarn run lint', DesktopDir))
  await runCommand(Command('yarn clean:build', DesktopDir))
  await runCommand(Command('yarn run build:web', RootDir))

  for (const group of CompileGroups) {
    let didCompileGroup = false
    for (const target of targets) {
      if (group.targets.includes(target)) {
        if (!didCompileGroup) {
          await runCommand(group.compileCommand)
          didCompileGroup = true
        }
        const buildCommands = BuildCommands[target]
        for (const buildCommand of buildCommands) {
          await runCommand(buildCommand)
        }
      }
    }
  }
}

const Targets = {
  Appimage: 'appimage',
  AppimageArm64: 'appimage-arm64',
  AppimageX64: 'appimage-x64',
  AppimageAll: 'appimage-all',
  Deb: 'deb',
  DebArm64: 'deb-arm64',
  Dir: 'dir',
  DirArm64: 'dir-arm64',
  Mac: 'mac',
  MacAll: 'mac-all',
  MacArm64: 'mac-arm64',
  Snap: 'snap',
  SnapArm64: 'snap-arm64',
  Windows: 'windows',
}

const MainstreamTargetGroup = 'mainstream'

const TargetGroups = {
  all: [
    Targets.AppimageAll,
    Targets.Deb,
    Targets.DebArm64,
    Targets.Dir,
    Targets.DirArm64,
    Targets.MacAll,
    Targets.Snap,
    Targets.SnapArm64,
    Targets.Windows,
  ],
  [MainstreamTargetGroup]: [
    Targets.Windows,
    Targets.AppimageAll,
    Targets.Deb,
    Targets.Snap,
    Targets.DebArm64,
    Targets.MacAll,
  ],
  mac: [Targets.MacArm64],
}

const arm64Env = { npm_config_target_arch: 'arm64' }

const CompileGroups = [
  {
    compileCommand: Command('yarn run webpack --config desktop.webpack.prod.js', DesktopDir),
    targets: [
      Targets.Appimage,
      Targets.AppimageX64,
      Targets.AppimageArm64,
      Targets.AppimageAll,
      Targets.Mac,
      Targets.MacArm64,
      Targets.MacAll,
      Targets.Dir,
      Targets.Windows,
    ],
  },
  {
    compileCommand: Command('yarn run webpack --config desktop.webpack.prod.js --env deb', DesktopDir),
    targets: [Targets.Deb],
  },
  {
    compileCommand: Command('yarn run webpack --config desktop.webpack.prod.js --env deb', DesktopDir, arm64Env),
    targets: [Targets.DebArm64],
  },
  {
    compileCommand: Command('yarn run webpack --config desktop.webpack.prod.js', DesktopDir, arm64Env),
    targets: [Targets.DirArm64],
  },
  {
    compileCommand: Command('yarn run webpack --config desktop.webpack.prod.js --env snap', DesktopDir),
    targets: [Targets.Snap],
  },
  {
    compileCommand: Command('yarn run webpack --config desktop.webpack.prod.js --env snap', DesktopDir, arm64Env),
    targets: [Targets.SnapArm64],
  },
]

const BuildCommands = {
  [Targets.Appimage]: [
    Command('yarn run electron-builder --linux --x64 --ia32 -c.linux.target=AppImage --publish=never', DesktopDir),
  ],
  [Targets.AppimageX64]: [
    Command('yarn run electron-builder --linux --x64 -c.linux.target=AppImage --publish=never', DesktopDir),
  ],
  [Targets.AppimageArm64]: [
    Command('yarn run electron-builder --linux --arm64 -c.linux.target=AppImage --publish=never', DesktopDir),
  ],
  [Targets.AppimageAll]: [
    Command(
      'yarn run electron-builder --linux --arm64 --x64 --ia32 -c.linux.target=AppImage --publish=never',
      DesktopDir,
    ),
  ],
  [Targets.Deb]: [
    Command('yarn run electron-builder --linux --x64 --ia32 -c.linux.target=deb --publish=never', DesktopDir),
  ],
  [Targets.DebArm64]: [
    Command('yarn run electron-builder --linux --arm64 -c.linux.target=deb --publish=never', DesktopDir, {
      npm_config_target_arch: 'arm64',
      USE_SYSTEM_FPM: 'true',
    }),
  ],
  [Targets.Mac]: [
    Command('yarn run electron-builder --mac --x64 --publish=never', DesktopDir),
    Command('node scripts/fix-mac-zip', ScriptsDir),
  ],
  [Targets.MacArm64]: [Command('yarn run electron-builder --mac --arm64 --publish=never', DesktopDir)],
  [Targets.MacAll]: [Command('yarn run electron-builder --macos --arm64 --x64 --publish=never', DesktopDir)],
  [Targets.Dir]: [Command('yarn run electron-builder --linux --x64 -c.linux.target=dir --publish=never', DesktopDir)],
  [Targets.DirArm64]: [
    Command('yarn run electron-builder --linux --arm64 -c.linux.target=dir --publish=never', DesktopDir, arm64Env),
  ],
  [Targets.Snap]: [Command('yarn run electron-builder --linux --x64 -c.linux.target=snap --publish=never', DesktopDir)],
  [Targets.SnapArm64]: [
    Command('yarn run electron-builder --linux --arm64 -c.linux.target=snap --publish=never', DesktopDir, {
      npm_config_target_arch: 'arm64',
      SNAPCRAFT_BUILD_ENVIRONMENT: 'host',
    }),
  ],
  [Targets.Windows]: [Command('yarn run electron-builder --windows --x64 --ia32 --publish=never', DesktopDir)],
}