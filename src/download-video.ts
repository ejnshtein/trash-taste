import * as ytdl from 'ytdl-core'
import fs from 'fs'

export const downloadFile = async (
  info: ytdl.videoInfo,
  video: ytdl.videoFormat,
  filePath: string
): Promise<void> => {
  const writeStream = fs.createWriteStream(filePath)

  console.log('Downloading video', info.videoDetails.title)

  return new Promise((resolve, reject) => {
    const stream = ytdl.downloadFromInfo(info, {
      quality: video.quality,
      format: video
    })
    stream.pipe(writeStream)
    stream.once('error', reject)
    stream.once('finish', () => {
      resolve()
    })
  })
}
