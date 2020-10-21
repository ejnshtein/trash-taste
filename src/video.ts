import * as ytdl from 'ytdl-core'
import fs from 'fs'
import path from 'path'
import { mkdirSafe } from '@lib/mkdir-safe'
import { downloadFile } from './download-video'
import { sendVideo } from './tg-api'
import { genRandomString } from './lib/get-random-string'
import { rmDirSafe } from './lib/rm-dir-safe'

export const checkCacheFolder = async (): Promise<void> => {
  await rmDirSafe('./.tmp')
  await mkdirSafe('./.tmp')
}

export const processVideo = async (videoId: string): Promise<void> => {
  const info = await ytdl.getInfo(`http://www.youtube.com/watch?v=${videoId}`)

  const video = info.formats.find(
    (format) => format.container === 'mp4' && format.hasAudio && format.hasVideo
  )

  const filePath = path.resolve(
    '.tmp',
    `${genRandomString(10)}.${info.videoDetails.title}.${video.container}`
  )

  await checkCacheFolder()

  try {
    const videoFilePath = await downloadFile(info, video, filePath)

    await sendVideo({
      duration: parseInt(video.approxDurationMs),
      path: videoFilePath,
      width: video.width,
      height: video.height,
      caption: `${info.title}\n\nyoutu.be/${videoId}`
    })
  } catch (e) {
    await fs.promises.unlink(vide)
  }
  // console.log(videoFilePath, 'downloaded!')
}
