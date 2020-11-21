import fs from 'fs'
import { pathExists } from './path-exists'

export interface CheckFileSizeArgument {
  filePath: string
  targetFileSize: number
}

export const checkFileSize = async ({
  filePath,
  targetFileSize
}: CheckFileSizeArgument): Promise<boolean> => {
  if (!(await pathExists(filePath))) {
    return false
  }
  const stats = await fs.promises.stat(filePath)

  return Math.abs(stats.size - targetFileSize) < 2000
}
