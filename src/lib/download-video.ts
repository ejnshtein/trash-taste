import * as ytdl from 'ytdl-core'
import fs from 'fs'

export const downloadVideo = async (
  info: ytdl.videoInfo,
  videoFormat: ytdl.videoFormat,
  filePath: string
): Promise<void> => {
  const writeStream = fs.createWriteStream(filePath)

  console.log(`Downloading video`, info.videoDetails.title)

  return new Promise((resolve, reject) => {
    const stream = ytdl.downloadFromInfo(info, {
      quality: videoFormat.quality,
      format: videoFormat
    })
    stream.pipe(writeStream)
    stream.once('error', reject)
    stream.once('end', () => {
      console.log(`Video downloaded`)
      resolve()
    })
  })
}
