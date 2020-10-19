import fs from 'fs'

export const mkdirSafe = async (path: string): Promise<void> => {
  try {
    await fs.promises.mkdir(path, { recursive: true })
  } catch {}
}
