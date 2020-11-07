import { spawn } from 'child_process'

export interface execAsyncSpawnOptions {
  logOutput?: boolean
}

export interface execAsyncResult {
  code: number
  result: string
}

export const execAsyncSpawn = (
  command: string,
  { logOutput = false }: execAsyncSpawnOptions = {}
): Promise<execAsyncResult> => {
  const [spawnCommand, ...args] = command.split(' ')
  const childProcess = spawn(spawnCommand, args, {
    stdio: 'pipe'
  })

  return new Promise((resolve, reject) => {
    let stdout = ''
    function addLine(data: Buffer) {
      stdout += data
      if (logOutput) {
        data
          .toString()
          .split('\n')
          .forEach((line) => {
            console.log(line)
          })
      }
    }
    childProcess.stdout.on('data', addLine)
    childProcess.stderr.on('data', addLine)
    childProcess.on('error', reject)
    childProcess.on('close', (code) => {
      resolve({ code, result: stdout })
    })
  })
}
