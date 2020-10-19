import { Airgram, Auth } from 'airgram'

const airgram = new Airgram({
  apiId: 405329,
  apiHash: 'e3d4cfb43423bf18292651b707c3a5d6',
  databaseDirectory: './tdl-db',
  filesDirectory: './tdl-files'
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
  console.log(uploadProgress, update.file.local.path)
})

export interface InputVideo {
  duration: number
  path: string
  width: number
  height: number
  caption: string
}

export const sendVideo = async (video: InputVideo): Promise<void> => {
  const { response } = await airgram.api.searchPublicChat({
    username: process.env.TELEGRAM_CHANNEL_ID
  })
  if (response._ === 'error') {
    throw new Error('Channel not found')
  }

  await airgram.api.sendMessage({
    chatId: response.id,
    inputMessageContent: {
      _: 'inputMessageVideo',
      duration: video.duration,
      video: {
        _: 'inputFileLocal',
        path: video.path
      },
      supportsStreaming: true,
      caption: {
        _: 'formattedText',
        text: video.caption
      },
      height: video.height,
      width: video.width
    }
  })
}
