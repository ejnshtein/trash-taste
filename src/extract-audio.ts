import ffmpeg from 'fluent-ffmpeg'
import fs from 'fs'
import path from 'path'

// ffmpeg.setFfmpegPath(path.join('usr', 'local', 'bin', 'ffmpeg'))

export const extractAudio = async (
  audioFilePath: string,
  filePath: string
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const outputStream = fs.createWriteStream(audioFilePath)
    ffmpeg()
      .input(filePath)
      .output(outputStream)
      .once('end', () => {
        resolve()
      })
      .once('error', reject)
      .run()
  })
}