import fs from 'fs'
import path from 'path'
import { pathExists } from './path-exists'

export const rmdirSafe = async (dirPath: string): Promise<boolean> => {
  const dirExists = await pathExists(dirPath)

  if (!dirExists) {
    return true
  }
  const files = await fs.promises.readdir(dirPath, {
    encoding: 'utf-8',
    withFileTypes: true
  })
  for (const file of files) {
    const filePath = path.join(dirPath, file.name)
    switch (true) {
      case file.isFile(): {
        await fs.promises.unlink(filePath)
        return true
      }
      case file.isDirectory(): {
        await rmdirSafe(filePath)
      }
    }
  }
  return true
}
