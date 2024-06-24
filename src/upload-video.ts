import path from 'path'
import fs from 'fs'
import * as ytdl from 'ytdl-core'
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

export const uploadVideo = createEvent<{
  videoUrl: string
  replyToMessageId: number
  callbackQueryId: string
  chatId: number
}>()

const { $updateMessage, setUpdateMessage, updateMessage } =
  updateMessageFactory()

export const uploadVideoFx = createEffect(
  async ({
    videoUrl,
    replyToMessageId
  }: {
    videoUrl: string
    replyToMessageId: number
  }) => {
    const message = await notifyAdminFx({
      chatId: env.ADMIN_ID,
      text: '(1/3) Processing video...',
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

    await updateMessage(`(2/3) Downloading video...`)

    try {
      await downloadFile(format.url, videoPath)
    } catch (err) {
      throw new Error(
        `(2/3) Downloading video...\nError: ${err.message}\n\n${err.stack}`
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
        `(2/3) Downloading thumbnail...\nError: ${err.message}\n\n${err.stack}`
      )
    }

    await updateMessage(`(3/3) Uploading video...`)

    const videoStream = fs.createReadStream(videoPath)

    try {
      await botClient.api.sendVideo(
        env.TELEGRAM_CHANNEL_ID,
        new InputFile(videoStream, path.basename(videoPath)),
        {
          caption: videoInfo.videoDetails.title,
          thumbnail: new InputFile(thumbnailPath),
          supports_streaming: true
        }
      )
    } catch (err) {
      throw new Error(
        `(3/3) Uploading video...\nError: ${err.message}\n\n${err.stack}`
      )
    }

    await updateMessage(`Done!`)

    await fs.promises.rm(videoPath)
    await fs.promises.rm(thumbnailPath)

    console.log(`Video uploaded!`)
  }
)

sample({
  clock: uploadVideo,
  filter: not(pending([uploadVideoFx])),
  target: [
    uploadVideoFx,
    answerCallbackQueryFx.prepend(({ callbackQueryId }) => ({
      callbackQueryId,
      text: 'Uploading video...'
    }))
  ]
})

sample({
  clock: uploadVideo,
  filter: pending([uploadVideoFx]),
  target: answerCallbackQueryFx.prepend(({ callbackQueryId }) => ({
    callbackQueryId,
    text: 'Please wait, the previous video is still being processed...'
  }))
})

reset({
  clock: uploadVideoFx.doneData,
  target: $updateMessage
})

sample({
  clock: uploadVideoFx.failData,
  fn: ({ message }) => message,
  target: [updateMessage, log]
})
