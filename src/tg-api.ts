import {
  Airgram,
  Auth,
  UpdateContext,
  UpdateFile,
  UpdateMessageSendFailed,
  UpdateMessageSendSucceeded
} from 'airgram'
import { createEffect, createStore } from 'effector'
import path from 'path'

const tdlibAbsolutePath = path.join('/usr', 'local', 'lib', 'libtdjson.so')

const airgram = new Airgram({
  apiId: parseInt(process.env.TG_API_ID),
  apiHash: process.env.TG_API_HASH,
  databaseDirectory: './tdl-db',
  filesDirectory: './tdl-files',
  logVerbosityLevel: 0,
  enableStorageOptimizer: true,
  command: tdlibAbsolutePath
})

airgram.use(
  new Auth({
    token: process.env.TOKEN
  })
)

export interface UploadingFile {
  name: string
  uploaded: number
  total: number
}

export const $uploading = createStore([])

const onUpdateFile = createEffect(
  async ({ update }: UpdateContext<UpdateFile>) => {
    const {
      remote: { uploadedSize },
      expectedSize
    } = update.file
    const uploadProgress = Math.round((uploadedSize / expectedSize) * 100)
    console.log(uploadProgress, path.basename(update.file.local.path))
  }
)
airgram.on('updateFile', onUpdateFile)

const onUpdateMessageSendSucceeded = createEffect(
  async ({ update }: UpdateContext<UpdateMessageSendSucceeded>) => {
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
  }
)
airgram.on('updateMessageSendSucceeded', onUpdateMessageSendSucceeded)

const onUpdateMessageSendFailed = createEffect(
  async ({ update }: UpdateContext<UpdateMessageSendFailed>) => {
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
  }
)
airgram.on('updateMessageSendFailed', onUpdateMessageSendFailed)

export interface InputAudio {
  duration: number
  path: string
  title: string
  performer: string
  caption: string
}

export const sendAudio = async (audio: InputAudio): Promise<void> => {
  const { response } = await airgram.api.searchPublicChat({
    username: process.env.TELEGRAM_CHANNEL_ID
  })
  if (response._ === 'error') {
    throw new Error('Channel not found')
  }

  console.log('Sending audio', audio)

  await airgram.api.sendMessage({
    chatId: response.id,
    inputMessageContent: {
      _: 'inputMessageAudio',
      duration: audio.duration,
      audio: {
        _: 'inputFileLocal',
        path: audio.path
      },
      title: audio.title,
      caption: {
        _: 'formattedText',
        text: audio.caption
      },
      performer: audio.performer
    }
  })
}
