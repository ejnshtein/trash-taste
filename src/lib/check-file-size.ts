import fs from 'fs'

const twoGB = 2 * 1024 * 1024 * 1024

const oneMB = 1 * 1024 * 1024
/**
 * `true` if size of a file is less than 2GB - 100mb
 */
export const checkFileSizeForTelegram = async (
  filePath: string
): Promise<boolean> => {
  const { size } = await fs.promises.lstat(filePath)

  return size < twoGB - oneMB
}
