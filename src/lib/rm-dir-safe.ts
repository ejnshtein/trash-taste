import fs from 'fs'

export const rmDirSafe = async (path: string): Promise<void> => {
  try {
    await fs.promises.rmdir(path, { recursive: true })
  } catch {}
}
