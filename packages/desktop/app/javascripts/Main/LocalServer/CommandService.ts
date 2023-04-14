import { spawn } from 'child_process'

type Command = {
  prompt: string
  extraEnv: Record<string, string>
}

export const CreateCommand = (prompt: string, extraEnv: Record<string, string> = {}): Command => {
  return { prompt, extraEnv }
}

export class CommandService {
  private logStream: string[] = []

  getLogs(): string[] {
    return this.logStream
  }

  clearLogs(): void {
    this.logStream = []
  }

  runCommand(commandObj: Command, workingDir?: string): Promise<{ code: number; output: string }> {
    console.log('Running command:', commandObj, workingDir)
    return new Promise((resolve, reject) => {
      const { prompt, extraEnv } = commandObj
      const [command, ...args] = prompt.split(' ')
      const options = { env: Object.assign({}, process.env, extraEnv), cwd: workingDir }
      const child = spawn(command, args, options)
      let output = ''
      child.stdout.on('data', (data) => {
        output += data.toString()
        this.logStream.push(data.toString())
        process.stdout.write(data)
      })
      child.stderr.on('data', (data) => {
        output += data.toString()
        this.logStream.push(data.toString())
        process.stderr.write(data)
      })
      child.on('error', reject)
      child.on('close', (code) => {
        resolve({ code: code ?? 0, output })
      })
    })
  }
}
