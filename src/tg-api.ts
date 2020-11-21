import {
  Airgram,
  Auth,
  FormattedText,
  SendMessageParams,
  UpdateContext,
  UpdateFile,
  UpdateMessageSendFailed,
  UpdateMessageSendSucceeded
} from 'airgram'
import {
  createEffect
  // createStore,
  // attach,
  // createEvent,
  // guard,
  // forward
} from 'effector'
import path from 'path'

const tdlibAbsolutePath = path.join('/usr', 'local', 'lib', 'libtdjson.so')

export const airgram = new Airgram({
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

// const setChatMessageId = createEvent<number>()
// const resetChatMessageId = createEvent<void>()
// const $chatMessageId = createStore<number>(null)
//   .on(setChatMessageId, (_, payload) => payload)
//   .reset(resetChatMessageId)

// export interface NotifyChatArgs {
//   name: string
//   progress: number
// }

// const notifyTimeout = createEffect(
//   (timeout: number) =>
//     new Promise((resolve) => {
//       setTimeout(resolve, timeout)
//     })
// )

// const notifyChat = createEvent<NotifyChatArgs>()
// const notifyChatFx = attach({
//   effect: createEffect(
//     async ({
//       name,
//       progress,
//       messageId
//     }: NotifyChatArgs & { messageId: number }): Promise<void> => {
//       const chatId = await getChatId(process.env.TELEGRAM_CHAT_ID)

//       await airgram.api.editMessageText({
//         chatId,
//         messageId,
//         inputMessageContent: {
//           _: 'inputMessageText',
//           text: {
//             _: 'formattedText',
//             text: `Uploading ${progress.toFixed(2)}% ${name}`
//           }
//         }
//       })
//     }
//   ),
//   mapParams: (params: NotifyChatArgs, states) => ({
//     ...params,
//     ...states
//   }),
//   source: {
//     messageId: $chatMessageId
//   }
// })

// forward({
//   from: notifyChat,
//   to: notifyTimeout.prepend(() => 2500)
// })

// guard({
//   source: notifyChat,
//   filter: notifyTimeout.pending.map((pending) => !pending),
//   target: notifyChatFx
// })

const onUpdateFile = createEffect(
  async ({ update }: UpdateContext<UpdateFile>) => {
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

    // return notifyChat({
    //   name: path.basename(update.file.local.path),
    //   progress: uploadProgress
    // })
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

export const getChatId = async (
  username = process.env.TELEGRAM_CHANNEL_ID
): Promise<number> => {
  const { response } = await airgram.api.searchPublicChat({
    username
  })
  if (response._ === 'error') {
    throw new Error('Channel not found')
  }

  return response.id
}

export const parseTextEntities = async (
  text: string
): Promise<FormattedText> => {
  const { response } = await airgram.api.parseTextEntities({
    parseMode: {
      _: 'textParseModeHTML'
    },
    text
  })
  if (response._ === 'error') {
    throw new Error(response.message)
  }

  return response
}
export interface InputFile {
  path: string
  caption: string
  duration: number
}

export interface InputAudio extends InputFile {
  performer: string
  title: string
}

export interface InputVideo extends InputFile {
  width: number
  height: number
  thumb?: string
}

export const sendAudio = async (
  audio: InputAudio,
  options: SendMessageParams = {}
): Promise<void> => {
  const chatId = await getChatId()
  console.log('Sending audio', audio)
  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async (resolve, reject) => {
    const watchingFileError = onUpdateMessageSendFailed.done.watch(() => {
      watchingFileError()
      watchFileSucceed()
      reject(new Error('Audio send error'))
    })
    const watchFileSucceed = onUpdateMessageSendSucceeded.done.watch(() => {
      watchingFileError()
      watchFileSucceed()
      resolve()
    })

    await airgram.api.sendMessage({
      ...options,
      chatId,
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
  })
}

export const sendVideo = async (
  video: InputVideo,
  options: SendMessageParams = {}
): Promise<void> => {
  const chatId = await getChatId()
  console.log('Sending video', video)

  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async (resolve, reject) => {
    const watchingFileError = onUpdateMessageSendFailed.done.watch(() => {
      watchingFileError()
      watchFileSucceed()
      reject(new Error('Video send error'))
    })
    const watchFileSucceed = onUpdateMessageSendSucceeded.done.watch(() => {
      watchingFileError()
      watchFileSucceed()
      resolve()
    })

    await airgram.api.sendMessage({
      ...options,
      chatId,
      inputMessageContent: {
        _: 'inputMessageVideo',
        duration: video.duration,
        caption: {
          _: 'formattedText',
          text: video.caption
        },
        video: {
          _: 'inputFileLocal',
          path: video.path
        },
        supportsStreaming: true,
        width: video.width,
        height: video.height,
        ...(video.thumb
          ? {
              thumbnail: {
                _: 'inputThumbnail',
                thumbnail: {
                  _: 'inputFileLocal',
                  path: video.thumb
                }
              }
            }
          : {})
      }
    })
  })
}
