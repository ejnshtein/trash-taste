import fs from 'fs'
import { pathExists } from './path-exists'

export interface CheckFileSizeArgument {
  filePath: string
}

export const fileIsTooBigForTelegram = async ({
  filePath
}: CheckFileSizeArgument): Promise<boolean> => {
  if (!(await pathExists(filePath))) {
    return false
  }
  const stats = await fs.promises.stat(filePath)

  return Math.abs(stats.size - 2e9) < 2000
}
