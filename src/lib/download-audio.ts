import * as ytdl from 'ytdl-core'
import fs from 'fs'

export const downloadAudio = async (
  info: ytdl.videoInfo,
  audio: ytdl.videoFormat,
  filePath: string
): Promise<void> => {
  const writeStream = fs.createWriteStream(filePath)

  console.log(`Downloading audio`, info.videoDetails.title)

  return new Promise((resolve, reject) => {
    const stream = ytdl.downloadFromInfo(info, {
      quality: audio.quality,
      format: audio
    })
    stream.pipe(writeStream)
    stream.once('error', reject)
    stream.once('end', () => {
      console.log(`Audio downloaded`)
      resolve()
    })
  })
}
