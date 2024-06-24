import path from 'path'
import fs from 'fs'
import * as ytdl from 'ytdl-core'
import { downloadFile } from './lib/download-file'
import { encodeAudio } from './lib/encode-audio'
import { env } from './lib/env'
import { addAudioMetadata } from './lib/add-audio-metadata'
import { botClient } from './tg-api'
import { createEffect, createEvent, sample } from 'effector'
import { not, pending, reset } from 'patronum'
import { InputFile } from 'grammy'
import {
  answerCallbackQueryFx,
  log,
  notifyAdminFx,
  updateMessageFactory
} from './model/common'

export const uploadAudio = createEvent<{
  videoUrl: string
  replyToMessageId: number
  callbackQueryId: string
  chatId: number
}>()

const { $updateMessage, setUpdateMessage, updateMessage } =
  updateMessageFactory()

const uploadAudioFx = createEffect(
  async ({
    videoUrl,
    replyToMessageId
  }: {
    videoUrl: string
    replyToMessageId: number
  }) => {
    const message = await notifyAdminFx({
      chatId: env.ADMIN_ID,
      text: '(1/5) Processing audio...',
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

    const format = ytdl.chooseFormat(videoInfo.formats, {
      filter: (q) => q.container === 'mp4' && !q.hasVideo
    })

    const audioPath = path.join(
      process.cwd(),
      '.tmp',
      `${videoInfo.videoDetails.videoId}.${
        format.container === 'mp4' ? 'm4a' : format.container
      }`
    )

    await updateMessage(`(2/5) Downloading audio...`)

    try {
      await downloadFile(format.url, audioPath)
    } catch (e) {
      throw new Error(`(2/5) Downloading audio...\nError: ${e.message}`)
    }

    await updateMessage(`(3/5) Encoding audio...`)

    let audioMP3path: string
    try {
      audioMP3path = await encodeAudio(audioPath)
    } catch (e) {
      throw new Error(
        `(3/5) Encoding audio...\nError: ${e.message}\n\n${e.stack}`
      )
    }

    await updateMessage(`(4/5) Adding metadata...`)

    try {
      await addAudioMetadata(audioMP3path, videoInfo.videoDetails.title)
    } catch (e) {
      throw new Error(`(4/5) Adding metadata...\nError: ${e.message}`)
    }

    await updateMessage(`(5/5) Uploading audio...`)

    const audioMP3 = fs.createReadStream(audioMP3path)

    try {
      await botClient.api.sendAudio(
        env.TELEGRAM_CHANNEL_ID,
        new InputFile(audioMP3, path.basename(audioMP3path)),
        {
          thumbnail: new InputFile(
            path.join(process.cwd(), 'assets', 'thumb.jpg')
          ),
          title: videoInfo.videoDetails.title,
          performer: 'TrashTaste Podcast',
          duration: parseInt(videoInfo.videoDetails.lengthSeconds, 10)
        }
      )
    } catch (e) {
      throw new Error(`(5/5) Uploading audio...\nError: ${e.message}`)
    }

    await updateMessage(`Done!`)

    await fs.promises.rm(audioMP3path)
    await fs.promises.rm(audioPath)
  }
)

sample({
  clock: uploadAudio,
  filter: not(pending([uploadAudioFx])),
  target: [
    uploadAudioFx,
    answerCallbackQueryFx.prepend(({ callbackQueryId }) => ({
      callbackQueryId,
      text: 'Uploading audio...'
    }))
  ]
})

sample({
  clock: uploadAudio,
  filter: pending([uploadAudioFx]),
  target: answerCallbackQueryFx.prepend(({ callbackQueryId }) => ({
    callbackQueryId,
    text: 'Please wait, the previous audio is still being processed...'
  }))
})

reset({
  clock: uploadAudioFx.doneData,
  target: $updateMessage
})

sample({
  clock: uploadAudioFx.failData,
  fn: ({ message }) => message,
  target: [updateMessage, log]
})
