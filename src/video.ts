import * as ytdl from 'ytdl-core'
import path from 'path'
import { mkdirSafe } from '@lib/mkdir-safe'
import { downloadFile } from './download-video'
import { sendAudio } from './tg-api'
import { pathExists } from '@lib/path-exists'
import { extractAudio } from './extract-audio'

export const processVideo = async (videoId: string): Promise<void> => {
  const info = await ytdl.getInfo(`https://www.youtube.com/watch?v=${videoId}`)

  const audio = info.formats.find(
    (format) =>
      format.container === 'mp4' && format.hasAudio && !format.hasVideo
  )

  const filePath = path.resolve(
    './.tmp',
    `${info.videoDetails.title}.${audio.container}`
  )

  const audioFilePath = path.resolve('./.tmp', `${info.videoDetails.title}.mp3`)

  if (!(await pathExists(filePath))) {
    await mkdirSafe('./.tmp')

    await downloadFile(info, audio, filePath)
  } else {
    console.log('Video already downloaded.')
  }

  await extractAudio(audioFilePath, filePath)

  await sendAudio({
    duration: parseInt(audio.approxDurationMs),
    path: audioFilePath,
    title: info.videoDetails.title,
    performer: info.videoDetails.ownerChannelName,
    caption: `${info.title}\n\nyoutu.be/${videoId}`
  })
  // console.log(videoFilePath, 'downloaded!')
}
