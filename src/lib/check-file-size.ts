import fs from 'fs'

/**
 * `true` if size of a file is less than 2GB - 100mb
 */
export const checkFileSizeForTelegram = async (
  filePath: string
): Promise<boolean> => {
  const { size } = await fs.promises.lstat(filePath)

  return size < 2 * 1000 * 1000 * 1000 - 1 * 1000 * 1000 * 100
}
