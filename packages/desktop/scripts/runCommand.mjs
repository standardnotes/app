import { spawn } from 'child_process'

export function runCommand(commandObj) {
  return new Promise((resolve, reject) => {
    const { prompt, extraEnv } = commandObj

    console.log(prompt, Object.keys(extraEnv).length > 0 ? extraEnv : '')

    const [command, ...args] = prompt.split(' ')
    const options = { cwd: commandObj.dir, env: Object.assign({}, process.env, extraEnv) }
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
