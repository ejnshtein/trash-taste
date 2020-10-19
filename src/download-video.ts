import * as ytdl from 'ytdl-core'
import path from 'path'
import fs from 'fs'
import { mkdirSafe } from '@lib/mkdir-safe'
import { genRandomString } from '@lib/get-random-string'

export const downloadFile = async (
  info: ytdl.videoInfo,
  video: ytdl.videoFormat
): Promise<string> => {
  await mkdirSafe('./.tmp')

  const filePath = path.resolve(
    '.tmp',
    `${genRandomString(10)}.${info.title}.${video.container}`
  )
  const writeStream = fs.createWriteStream(filePath)

  return new Promise((resolve, reject) => {
    const stream = ytdl.downloadFromInfo(info, {
      quality: video.quality,
      format: video
    })
    stream.pipe(writeStream)
    stream.once('error', reject)
    stream.once('finish', () => {
      resolve(filePath)
    })
  })
}
