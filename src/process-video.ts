import path from 'path'
import * as ytdl from 'ytdl-core'
import { mkdirSafe } from '@lib/mkdir-safe'
import { downloadVideo } from '@lib/download-video'
import { downloadFile } from '@lib/download-file'
import { rmdirSafe } from '@lib/rmdir-safe'
import { fileIsTooBigForTelegram } from '@lib/check-file-size'

import { sendAudio, sendVideo } from '@src/tg-api'
import { $items, addItem, editItem, removeItem } from '@src/store'
import { mergeStreams } from '@src/merge-streams'

export const processVideo = async (videoId: string): Promise<void> => {
  const info = await ytdl.getInfo(`https://www.youtube.com/watch?v=${videoId}`)

  const audio = info.formats
    .filter((f) => f.hasAudio && !f.hasVideo && f.container === 'mp4')
    .sort((a, b) => b.audioBitrate - a.audioBitrate)
    .shift()

  const video = info.formats
    .filter(
      (f) =>
        !f.hasAudio &&
        f.hasVideo &&
        f.container === 'mp4' &&
        (!f.contentLength || parseInt(f.contentLength) < 2 * 1e9)
    )
    .sort((a, b) => b.bitrate - a.bitrate)
    .shift()

  if (video.isLive) {
    removeItem(info.videoDetails.videoId)
    return
  }

  addItem({
    id: videoId,
    sendFilesToTg: false
  })

  const item = $items.getState().find((e) => e.id === videoId)

  if (item.processing) {
    return
  }

  editItem({ id: videoId, processing: true })

  console.log(`Processing ${videoId} ${info.videoDetails.title}`)
  console.log(video.url)

  const { url: thumbUrl } = info.videoDetails.thumbnail.thumbnails[
    info.videoDetails.thumbnail.thumbnails.length - 1
  ]

  const videoDirPath = path.resolve('./.tmp', info.videoDetails.videoId)
  const audioFilePath = path.join(videoDirPath, 'audio.mp3')
  const videoFilePath = path.join(videoDirPath, 'video.mp4')
  const thumbFilePath = path.join(
    videoDirPath,
    `thumb.${path.parse(thumbUrl).ext}`
  )
  const destVideoFile = path.join(videoDirPath, `result-video.mp4`)

  await mkdirSafe(videoDirPath)

  if (item.sendFilesToTg) {
    editItem({ id: videoId, processing: false })
    return
  }
  try {
    await Promise.all([
      downloadVideo(info, video, videoFilePath),
      downloadVideo(info, audio, audioFilePath),
      downloadFile(thumbUrl, thumbFilePath)
    ])
    await mergeStreams({
      video: videoFilePath,
      audio: audioFilePath,
      result: destVideoFile
    })

    if (!(await fileIsTooBigForTelegram({ filePath: destVideoFile }))) {
      await sendVideo(
        {
          caption: info.videoDetails.title,
          duration: parseInt(video.contentLength),
          height: video.height,
          width: video.width,
          path: destVideoFile,
          thumb: thumbFilePath
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
    }
    await sendAudio({
      duration: parseInt(audio.approxDurationMs),
      path: audioFilePath,
      title: info.videoDetails.title,
      performer: info.videoDetails.ownerChannelName,
      caption: `${info.videoDetails.title}\n\nyoutu.be/${videoId}`
    })
    editItem({ id: videoId, sendFilesToTg: true })
  } catch (e) {
    console.log(e)
    editItem({ id: videoId, sendFilesToTg: false, processing: false })
    return
  }

  await rmdirSafe(videoDirPath)

  console.log(`${info.videoDetails.title} processed!`)

  editItem({ id: videoId, processing: false })
}
