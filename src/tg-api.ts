import { Airgram, Auth } from 'airgram'
import path from 'path'

const airgram = new Airgram({
  apiId: parseInt(process.env.TG_API_ID),
  apiHash: process.env.TG_API_HASH,
  databaseDirectory: './tdl-db',
  filesDirectory: './tdl-files',
  logVerbosityLevel: 0,
  enableStorageOptimizer: true
})

airgram.use(
  new Auth({
    token: process.env.TOKEN
  })
)

airgram.on('updateFile', async ({ update }, next) => {
  const {
    remote: { uploadedSize },
    expectedSize
  } = update.file
  const uploadProgress = Math.round((uploadedSize / expectedSize) * 100)
  console.log(uploadProgress, path.basename(update.file.local.path))
})

airgram.on('updateMessageSendSucceeded', async (ctx) => {
  switch (ctx.update.message.content._) {
    case 'messageVideo': {
      console.log(ctx.update.message.content.video)
    }
  }
})

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
