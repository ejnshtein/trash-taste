import path from 'path'
import { airgram } from './tg-api'

airgram.on('updateFile', async ({ update }) => {
  const {
    remote: { uploadedSize },
    expectedSize
  } = update.file
  const uploadProgress = (uploadedSize / expectedSize) * 100

  console.log(
    `Uploading ${uploadProgress.toFixed(2)}% ${path.basename(
      update.file.local.path
    )}`
  )
})

airgram.on('updateMessageSendSucceeded', async ({ update }) => {
  const { content } = update.message
  switch (content._) {
    case 'messageVideo': {
      return {
        _: 'video',
        video: content.video
      }
    }
    case 'messageAudio': {
      return {
        _: 'audio',
        audio: content.audio
      }
    }
  }
})

airgram.on('updateMessageSendFailed', async ({ update }) => {
  const { content } = update.message
  switch (content._) {
    case 'messageVideo': {
      return {
        _: 'video',
        video: content.video
      }
    }
    case 'messageAudio': {
      return {
        _: 'audio',
        audio: content.audio
      }
    }
  }
})
