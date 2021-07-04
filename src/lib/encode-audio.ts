import ffmpeg from 'fluent-ffmpeg'
import path from 'path'

ffmpeg.setFfmpegPath('/opt/ffmpeg/bin/ffmpeg')

/**
 * ffmpeg -i input.wav -vn -ar 44100 -ac 2 -b:a 192k output.mp3
 */

export const encodeAudio = async (
  audioFilePath: string,
  bitrate: number
): Promise<string> => {
  const { name, dir } = path.parse(audioFilePath)
  return new Promise((resolve, reject) => {
    const saveToFile = path.join(dir, `${name}.mp3`)
    ffmpeg(audioFilePath)
      .audioBitrate(bitrate)
      .audioChannels(2)
      .audioFrequency(44100)
      .noVideo()
      .once('end', () => {
        resolve(saveToFile)
      })
      .once('error', reject)
      .saveToFile(saveToFile)
  })
}
