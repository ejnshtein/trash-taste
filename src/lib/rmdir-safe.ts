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
    await fs.promises.rm(filePath, {
      recursive: true
    })
  }
  return true
}
