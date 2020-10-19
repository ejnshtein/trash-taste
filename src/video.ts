import fs from 'fs'
import path from 'path'
import * as ytdl from 'ytdl-core'
import request from '@ejnshtein/smol-request'
import { genRandomString } from './lib/get-random-string'

export const mkdirSafe = async (path: string): Promise<void> => {
  try {
    await fs.promises.mkdir(path, { recursive: true })
  } catch {}
}

export const processVideo = async (videoId: string): Promise<void> => {
  const info = await ytdl.getInfo(`http://www.youtube.com/watch?v=${videoId}`)

  const video = info.formats.find(
    (format) => format.container === 'mp4' && format.hasAudio && format.hasVideo
  )

  const videoFilePath = await downloadFile(info, video)

  console.log(videoFilePath, 'downloaded!')
}

const downloadFile = async (
  info: ytdl.videoInfo,
  video: ytdl.videoFormat
): Promise<string> => {
  await mkdirSafe('./.tmp')

  const filePath = path.resolve(
    '.tmp',
    `${genRandomString(10)}.${info.title}.${video.container}`
  )
  const writeStream = fs.createWriteStream(filePath)

  const stream = ytdl.downloadFromInfo(info, {
    quality: video.quality,
    format: video
  })

  return new Promise((resolve, reject) => {
    stream.pipe(writeStream)
    stream.once('error', reject)
    stream.once('finish', () => {
      resolve(filePath)
    })
  })
}
