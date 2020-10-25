import ffmpeg from 'fluent-ffmpeg'
import fs from 'fs'

export const extractAudio = async (
  audioFilePath: string,
  filePath: string
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const outputStream = fs.createWriteStream(audioFilePath)
    ffmpeg(filePath)
      .output(outputStream)
      .once('end', () => {
        resolve()
      })
      .once('error', reject)
      .run()
  })
}
