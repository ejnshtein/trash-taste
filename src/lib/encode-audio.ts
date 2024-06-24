import { FFMPEG_PATH } from '@src/constants'
import ffmpeg from 'fluent-ffmpeg'
import path from 'path'

ffmpeg.setFfmpegPath(FFMPEG_PATH)

/**
 * ffmpeg -i input.wav -vn -ar 44100 -ac 2 -b:a 192k output.mp3
 */

export const encodeAudio = async (audioFilePath: string): Promise<string> => {
  const { name, dir } = path.parse(audioFilePath)
  const saveToFile = path.join(dir, `${name}.mp3`)

  return new Promise((resolve, reject) => {
    ffmpeg(audioFilePath)
      .audioCodec('libmp3lame')
      .videoCodec('copy')
      // quality
      .outputOption('-q:a 4')
      .once('end', () => {
        resolve(saveToFile)
      })
      .once('error', reject)
      .saveToFile(saveToFile)
  })
}
