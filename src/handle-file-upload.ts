import EventEmitter from 'events'
import { airgram } from './tg-api'

export const events = new EventEmitter()

airgram.on('updateFile', async ({ update }) => {
  events.emit('uploadFile', update)
})

airgram.on('updateMessageSendSucceeded', async ({ update }) => {
  const { content } = update.message
  switch (content._) {
    case 'messageVideo': {
      events.emit('videoUploaded', update)
      break
    }
    case 'messageAudio': {
      events.emit('audioUploaded', update)
      break
    }
  }
})

airgram.on('updateMessageSendFailed', async ({ update }) => {
  const { content } = update.message
  switch (content._) {
    case 'messageVideo': {
      events.emit('videoUploadFailed', update)
      break
    }
    case 'messageAudio': {
      events.emit('audioUploadFailed', update)
      break
    }
  }
})
