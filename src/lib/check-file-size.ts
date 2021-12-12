import fs from 'fs'

const twoGB = 2 * 1000 * 1000 * 1000

const oneMB = 1 * 1000 * 1000
/**
 * `true` if size of a file is less than 2GB - 100mb
 */
export const checkFileSizeForTelegram = async (
  filePath: string
): Promise<boolean> => {
  const { size } = await fs.promises.lstat(filePath)

  return size < twoGB - oneMB
}
