import fs from 'fs'
import { pathExists } from './path-exists'

export const mkdirSafe = async (dirPath: string): Promise<void> => {
  const exists = await pathExists(dirPath)

  if (!exists) {
    try {
      await fs.promises.mkdir(dirPath, { recursive: true })
    } catch {}
  }
}
