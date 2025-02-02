import path from 'path'
import fs from 'fs'
import * as ytdl from '@distube/ytdl-core'
import { downloadFile } from '@src/lib/download-file'
import { checkFileSizeForTelegram } from '@lib/check-file-size'
import { env } from '@lib/env'
import { createEffect, createEvent, sample } from 'effector'
import {
  answerCallbackQueryFx,
  log,
  notifyAdminFx,
  updateMessageFactory
} from './model/common'
import { not, pending, reset } from 'patronum'
import { botClient } from './tg-api'
import { InputFile } from 'grammy'
import { encodeAudio } from './lib/encode-audio'
import { addAudioMetadata } from './lib/add-audio-metadata'

const audioThumbnailPath = path.join(process.cwd(), 'assets', 'thumb.jpg')

export const uploadVideoAndAudio = createEvent<{
  videoUrl: string
  replyToMessageId: number
  callbackQueryId: string
  chatId: number
}>()

const { $updateMessage, setUpdateMessage, updateMessage } =
  updateMessageFactory()

export const uploadVideoAndAudioFx = createEffect(
  async ({
    videoUrl,
    replyToMessageId
  }: {
    videoUrl: string
    replyToMessageId: number
  }) => {
    const message = await notifyAdminFx({
      chatId: env.ADMIN_ID,
      text: 'Video: (1/3) Processing video...',
      replyToMessageId
    })

    setUpdateMessage({
      chatId: message.chat.id,
      messageId: message.message_id
    })

    const videoInfo = await ytdl.getInfo(videoUrl)

    if (videoInfo.videoDetails.isLiveContent) {
      throw new Error(
        'This video is a live broadcast, live broadcasts does not support uploading to telegram!'
      )
    }

    const format = videoInfo.formats
      .filter((q) => q.hasAudio && q.hasVideo)
      .sort((q1, q2) => q1.width - q2.width)
      .pop()

    const videoPath = path.join(
      process.cwd(),
      '.tmp',
      `video-${videoInfo.videoDetails.videoId}.${format.container}`
    )

    await updateMessage(`Video: (2/3) Downloading video...`)

    try {
      await downloadFile(format.url, videoPath)
    } catch (err) {
      throw new Error(
        `Video: (2/3) Downloading video...\nError: ${err.message}\n\n${err.stack}`
      )
    }

    if (!(await checkFileSizeForTelegram(videoPath))) {
      await updateMessage(
        `Unfortunately, file size is bigger than 2GB, can't upload to Telegram.`
      )

      return
    }

    const thumbnail = []
      .concat(
        videoInfo.videoDetails.thumbnails.sort((a, b) => a.width - b.width)
      )
      .pop()
    const thumbnailPath = path.join(
      process.cwd(),
      '.tmp',
      `thumbnail-${videoInfo.videoDetails.videoId}.jpg`
    )

    try {
      await downloadFile(thumbnail.url, thumbnailPath)
    } catch (err) {
      throw new Error(
        `Video: (2/3) Downloading thumbnail...\nError: ${err.message}\n\n${err.stack}`
      )
    }

    await updateMessage(`Video: (3/3) Uploading video...`)

    const videoStream = fs.createReadStream(videoPath)

    const thumbnailStream = fs.createReadStream(thumbnailPath)

    try {
      await botClient.api.sendVideo(
        env.TELEGRAM_CHANNEL_ID,
        new InputFile(videoStream, path.basename(videoPath)),
        {
          caption: videoInfo.videoDetails.title,
          thumbnail: new InputFile(
            thumbnailStream,
            path.basename(thumbnailPath)
          ),
          supports_streaming: true
        }
      )
    } catch (err) {
      throw new Error(
        `Video: (3/3) Uploading video...\nError: ${err.message}\n\n${err.stack}`
      )
    }

    // await updateMessage(`Done!`)

    // await fs.promises.rm(videoPath)
    // await fs.promises.rm(thumbnailPath)

    // console.log(`Video uploaded!`)

    await updateMessage(`Audio: (1/3) Encoding audio...`)

    let audioMP3path: string
    try {
      audioMP3path = await encodeAudio(videoPath)
    } catch (e) {
      throw new Error(
        `Audio: (1/3) Encoding audio...\nError: ${e.message}\n\n${e.stack}`
      )
    }

    await updateMessage(`Audio: (2/3) Adding metadata...`)

    try {
      await addAudioMetadata(audioMP3path, videoInfo.videoDetails.title)
    } catch (e) {
      throw new Error(`Audio: (2/3) Adding metadata...\nError: ${e.message}`)
    }

    await updateMessage(`Audio: (3/3) Uploading audio...`)

    const audioMP3 = fs.createReadStream(audioMP3path)
    const audioThumbnailStream = fs.createReadStream(audioThumbnailPath)

    try {
      await botClient.api.sendAudio(
        env.TELEGRAM_CHANNEL_ID,
        new InputFile(audioMP3, path.basename(audioMP3path)),
        {
          thumbnail: new InputFile(
            audioThumbnailStream,
            path.basename(audioThumbnailPath)
          ),
          title: videoInfo.videoDetails.title,
          performer: 'TrashTaste Podcast',
          duration: parseInt(videoInfo.videoDetails.lengthSeconds, 10)
        }
      )
    } catch (e) {
      throw new Error(`Audio: (3/3) Uploading audio...\nError: ${e.message}`)
    }

    await updateMessage(`Done!`)

    const deleteResult = await Promise.allSettled([
      fs.promises.rm(audioMP3path),
      fs.promises.rm(videoPath),
      fs.promises.rm(thumbnailPath)
    ])

    if (deleteResult.some((r) => r.status === 'rejected')) {
      throw new Error(
        `Error deleting files:\n${deleteResult
          .filter((r) => r.status === 'rejected')
          .map((r) => r.reason)}`
      )
    }
  }
)

sample({
  clock: uploadVideoAndAudio,
  filter: not(pending([uploadVideoAndAudioFx])),
  target: [
    uploadVideoAndAudioFx,
    answerCallbackQueryFx.prepend(({ callbackQueryId }) => ({
      callbackQueryId,
      text: 'Uploading video and audio...'
    }))
  ]
})

sample({
  clock: uploadVideoAndAudio,
  filter: pending([uploadVideoAndAudioFx]),
  target: answerCallbackQueryFx.prepend(({ callbackQueryId }) => ({
    callbackQueryId,
    text: 'Please wait, the previous video is still being processed...'
  }))
})

reset({
  clock: uploadVideoAndAudioFx.doneData,
  target: $updateMessage
})

sample({
  clock: uploadVideoAndAudioFx.failData,
  fn: ({ message }) => message,
  target: [updateMessage, log]
})
