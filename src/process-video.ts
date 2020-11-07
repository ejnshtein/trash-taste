import 'module-alias/register'
import * as ytdl from 'ytdl-core'
import path from 'path'
import { mkdirSafe } from '@lib/mkdir-safe'
import { pathExists } from '@lib/path-exists'
import { downloadFile } from '@src/download-video'
import { sendAudio, sendVideo } from '@src/tg-api'
import { extractAudio } from '@src/extract-audio'
import { rmdirSafe } from './lib/rmdir-safe'

export const processVideo = async (videoId: string): Promise<void> => {
  const info = await ytdl.getInfo(`https://www.youtube.com/watch?v=${videoId}`)

  const audio = info.formats
    .filter((f) => f.hasAudio && f.container === 'mp4')
    .sort((a, b) => b.audioBitrate - a.audioBitrate)
    .shift()

  const video = info.formats
    .filter((f) => f.hasAudio && f.hasVideo && f.container === 'mp4')
    .sort((a, b) => b.bitrate - a.bitrate)
    .shift()

  const filePath = path.resolve(
    './.tmp',
    `${info.videoDetails.title}.${audio.container}`
  )

  // const thumbFilePath = path.resolve(
  //   './.tmp',
  //   `${info.videoDetails.title}-thumb.${path.extname(
  //     info.videoDetails.thumbnail.thumbnails.pop().url
  //   )}`
  // )

  const audioFilePath = path.resolve('./.tmp', `${info.videoDetails.title}.mp3`)

  if (!(await pathExists(filePath))) {
    await mkdirSafe('./.tmp')

    await downloadFile(info, audio, filePath)
  } else {
    console.log('Video already downloaded.')
  }

  await extractAudio(audioFilePath, filePath)

  await sendVideo(
    {
      caption: info.videoDetails.title,
      duration: parseInt(video.contentLength),
      height: video.height,
      width: video.width,
      path: filePath
    },
    {
      replyMarkup: {
        _: 'replyMarkupInlineKeyboard',
        rows: [
          [
            {
              _: 'inlineKeyboardButton',
              text: 'Watch on Youtube',
              type: {
                _: 'inlineKeyboardButtonTypeUrl',
                url: `https://youtu.be/${videoId}`
              }
            }
          ]
        ]
      }
    }
  )

  await sendAudio({
    duration: parseInt(audio.approxDurationMs),
    path: audioFilePath,
    title: info.videoDetails.title,
    performer: info.videoDetails.ownerChannelName,
    caption: `${info.videoDetails.title}\n\nyoutu.be/${videoId}`
  })

  await rmdirSafe(path.resolve('./.tmp'))

  console.log(`${info.videoDetails.title} processed!`)
}

// if (!argv('--video')) {
//   console.error('No video was provided')
//   process.exit(1)
// }

// processVideo(getArgv('--video')).then(() => {
//   console.log('Video send!')
// })
