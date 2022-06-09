import { spawn } from 'child_process'
import fs from 'fs'

async function buildTargets(targets) {
  console.log('Building targets: ', targets)
  await runCommand(Command('yarn run lint'))
  await runCommand(Command('yarn clean:build'))
  // await runCommand(Command('yarn run build:web'))

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

function runCommand(commandObj) {
  return new Promise((resolve, reject) => {
    const { prompt, extraEnv } = commandObj
    console.log(prompt, Object.keys(extraEnv).length > 0 ? extraEnv : '')
    const [command, ...args] = prompt.split(' ')
    const options = { env: Object.assign({}, process.env, extraEnv) }
    const child = spawn(command, args, options)
    child.stdout.pipe(process.stdout)
    child.stderr.pipe(process.stderr)
    child.on('error', reject)
    child.on('close', (code) => {
      if (code > 0) {
        reject(code)
      } else {
        resolve(code)
      }
    })
  })
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

const Command = function (prompt, extraEnv = {}) {
  return {
    prompt,
    extraEnv,
  }
}

const CompileGroups = [
  {
    compileCommand: Command('yarn run webpack --config desktop.webpack.prod.js'),
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
    compileCommand: Command('yarn run webpack --config desktop.webpack.prod.js --env deb'),
    targets: [Targets.Deb],
  },
  {
    compileCommand: Command('yarn run webpack --config desktop.webpack.prod.js --env deb', arm64Env),
    targets: [Targets.DebArm64],
  },
  {
    compileCommand: Command('yarn run webpack --config desktop.webpack.prod.js', arm64Env),
    targets: [Targets.DirArm64],
  },
  {
    compileCommand: Command('yarn run webpack --config desktop.webpack.prod.js --env snap'),
    targets: [Targets.Snap],
  },
  {
    compileCommand: Command('yarn run webpack --config desktop.webpack.prod.js --env snap', arm64Env),
    targets: [Targets.SnapArm64],
  },
]

const BuildCommands = {
  [Targets.Appimage]: [
    Command('yarn run electron-builder --linux --x64 --ia32 -c.linux.target=AppImage --publish=never'),
  ],
  [Targets.AppimageX64]: [Command('yarn run electron-builder --linux --x64 -c.linux.target=AppImage --publish=never')],
  [Targets.AppimageArm64]: [
    Command('yarn run electron-builder --linux --arm64 -c.linux.target=AppImage --publish=never'),
  ],
  [Targets.AppimageAll]: [
    Command('yarn run electron-builder --linux --arm64 --x64 --ia32 -c.linux.target=AppImage --publish=never'),
  ],
  [Targets.Deb]: [Command('yarn run electron-builder --linux --x64 --ia32 -c.linux.target=deb --publish=never')],
  [Targets.DebArm64]: [
    Command('yarn run electron-builder --linux --arm64 -c.linux.target=deb --publish=never', {
      npm_config_target_arch: 'arm64',
      USE_SYSTEM_FPM: 'true',
    }),
  ],
  [Targets.Mac]: [
    Command('yarn run electron-builder --mac --x64 --publish=never'),
    Command('node scripts/fix-mac-zip'),
  ],
  [Targets.MacArm64]: [Command('yarn run electron-builder --mac --arm64 --publish=never')],
  [Targets.MacAll]: [Command('yarn run electron-builder --macos --arm64 --x64 --publish=never')],
  [Targets.Dir]: [Command('yarn run electron-builder --linux --x64 -c.linux.target=dir --publish=never')],
  [Targets.DirArm64]: [
    Command('yarn run electron-builder --linux --arm64 -c.linux.target=dir --publish=never', arm64Env),
  ],
  [Targets.Snap]: [Command('yarn run electron-builder --linux --x64 -c.linux.target=snap --publish=never')],
  [Targets.SnapArm64]: [
    Command('yarn run electron-builder --linux --arm64 -c.linux.target=snap --publish=never', {
      npm_config_target_arch: 'arm64',
      SNAPCRAFT_BUILD_ENVIRONMENT: 'host',
    }),
  ],
  [Targets.Windows]: [Command('yarn run electron-builder --windows --x64 --ia32 --publish=never')],
}

async function publishSnap() {
  const packageJson = await fs.promises.readFile('./package.json')
  const version = JSON.parse(packageJson).version
  await runCommand(Command(`snapcraft upload dist/standard-notes-${version}-linux-amd64.snap`))
}

;(async () => {
  try {
    const input = process.argv[2]
    let targets = input.split(',')

    console.log('Input targets:', targets)

    if (targets.length === 1) {
      if (TargetGroups[targets[0]]) {
        targets = TargetGroups[targets[0]]
      }
    }
    await buildTargets(targets)

    if (input === MainstreamTargetGroup) {
      await runCommand(Command('node scripts/sums.mjs'))
      await runCommand(Command('node scripts/create-draft-release.mjs'))
      await publishSnap()
    }
  } catch (e) {
    console.error(e)
    process.exitCode = 1
  }
})()
