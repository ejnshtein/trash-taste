import { createEvent, createStore, sample } from 'effector'
import { uploadVideo, uploadVideoFx } from '@src/upload-video'
import { uploadAudio, uploadAudioFx } from '@src/upload-audio'
import { reset } from 'patronum'
import { answerCallbackQueryFx, notifyAdminFx } from '@src/model/common'
import { env } from '@src/lib/env'

export const uploadBoth = createEvent<{
  videoUrl: string
  replyToMessageId: number
  callbackQueryId: string
  chatId: number
}>()
const $uploadBothParameters = createStore<{
  videoUrl: string
  replyToMessageId: number
  callbackQueryId: string
  chatId: number
} | null>(null).on(uploadBoth, (_, a) => a)

sample({
  clock: $uploadBothParameters,
  filter: (params) => params !== null,
  target: [
    uploadVideo,
    answerCallbackQueryFx.prepend(({ callbackQueryId }) => ({
      callbackQueryId,
      text: 'Processing both video and audio...'
    }))
  ]
})

sample({
  clock: uploadVideoFx.done,
  source: $uploadBothParameters,
  filter: (params) => params !== null,
  target: uploadAudio
})

sample({
  clock: uploadAudioFx.done,
  target: notifyAdminFx.prepend(() => ({
    chatId: env.ADMIN_ID,
    text: 'Both video and audio has been uploaded!'
  }))
})

reset({
  clock: uploadAudioFx.done,
  target: $uploadBothParameters
})
