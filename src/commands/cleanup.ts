import path from 'path'
import fs from 'fs'

const tmpDir = path.join(__dirname, '..', '..', '.tmp')

export const cleanupTMPDir = async (): Promise<void> => {
  const files = await fs.promises.readdir(tmpDir, {
    encoding: 'utf-8',
    withFileTypes: true
  })

  for (const file of files) {
    if (file.isFile()) {
      await fs.promises.rm(path.join(tmpDir, file.name))
    }
  }
}
