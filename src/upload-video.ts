import path from 'path'
import {
  Error,
  SendMessageParams,
  UpdateFile,
  UpdateMessageSendFailed,
  UpdateNewCallbackQuery
} from 'airgram'
import * as ytdl from 'ytdl-core'
import { getVideoUrlFromTextEntities } from '@lib/get-video-url-from-text-entities'
import { downloadVideo } from '@lib/download-video'
import { checkFileSizeForTelegram } from '@lib/check-file-size'
import { TELEGRAM_CHANNEL_ID } from '@lib/env'
import { airgram, parseTextEntities } from './tg-api'
import { events } from './handle-file-upload'

export const uploadVideo = async (
  update: UpdateNewCallbackQuery
): Promise<Error | void> => {
  const { response: messageToUpdate } = await airgram.api.sendMessage({
    chatId: update.chatId,
    inputMessageContent: {
      _: 'inputMessageText',
      text: await parseTextEntities(`(1/3) Processing video...`)
    }
  })

  if (messageToUpdate._ === 'error') {
    return messageToUpdate
  }

  const { response } = await airgram.api.getMessage({
    chatId: update.chatId,
    messageId: update.messageId
  })

  if (response._ === 'error') {
    return response
  }

  const videoUrl = getVideoUrlFromTextEntities(response.content)

  if (!videoUrl) {
    await airgram.api.sendMessage({
      chatId: update.chatId,
      replyToMessageId: update.messageId,
      inputMessageContent: {
        _: 'inputMessageText',
        text: await parseTextEntities(
          `Unable to parse video id from this message :(`
        )
      }
    })
    return
  }
  const videoInfo = await ytdl.getInfo(videoUrl)

  if (videoInfo.videoDetails.isLiveContent) {
    return {
      _: 'error',
      code: 400,
      message:
        'This video is a live broadcast, live broadcasts does not support uploading to telegram!'
    }
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

  await airgram.api.getChat({
    chatId: messageToUpdate.chatId
  })

  await airgram.api.sendMessage({
    chatId: update.chatId,
    inputMessageContent: {
      _: 'inputMessageText',
      text: await parseTextEntities(`(2/3) Downloading video...`)
    }
  })

  try {
    console.log('(2/3) Downloading video...')
    await downloadVideo(videoInfo, format, videoPath)
  } catch (e) {
    await airgram.api.sendMessage({
      chatId: update.chatId,
      inputMessageContent: {
        _: 'inputMessageText',
        text: await parseTextEntities(
          `Ooops!\nGot an error during downloading of the video: ${e}`
        )
      }
    })
    return
  }

  if (!(await checkFileSizeForTelegram(videoPath))) {
    await airgram.api.sendMessage({
      chatId: update.chatId,
      inputMessageContent: {
        _: 'inputMessageText',
        text: await parseTextEntities(
          `Unfortunately, file size is bigger than 2GB, can't upload to Telegram.`
        )
      }
    })

    return
  }

  await airgram.api.sendMessage({
    chatId: update.chatId,
    inputMessageContent: {
      _: 'inputMessageText',
      text: await parseTextEntities(`(3/3) Uploading video...`)
    }
  })

  const { response: getChatResponse } = await airgram.api.getChat({
    chatId: parseInt(TELEGRAM_CHANNEL_ID)
  })

  if (getChatResponse._ === 'error') {
    return getChatResponse
  }

  const { id } = getChatResponse

  const videoMessage: SendMessageParams = {
    chatId: id,
    inputMessageContent: {
      _: 'inputMessageVideo',
      video: {
        _: 'inputFileLocal',
        path: videoPath
      },
      thumbnail: {
        _: 'inputThumbnail',
        thumbnail: {
          _: 'inputFileLocal',
          path: path.join(process.cwd(), 'assets', 'thumb.jpg')
        }
      },
      caption: await parseTextEntities(videoInfo.videoDetails.title)
    }
  }

  const { response: newVideoResponse } = await airgram.api.sendMessage(
    videoMessage
  )

  if (newVideoResponse._ === 'error') {
    return newVideoResponse
  }

  try {
    await new Promise<void>((resolve, reject) => {
      let canSendUpdateMessage = true
      const interval = setInterval(() => {
        if (!canSendUpdateMessage) {
          canSendUpdateMessage = true
        }
      }, 5000)

      const onFileUpload = async (fileUpdate: UpdateFile) => {
        if (!canSendUpdateMessage) {
          return
        }

        canSendUpdateMessage = false

        const {
          remote: { uploadedSize },
          expectedSize
        } = fileUpdate.file
        const uploadProgress = (uploadedSize / expectedSize) * 100

        const msg = `Uploading ${uploadProgress.toFixed(2)}% ${path.basename(
          fileUpdate.file.local.path
        )}`

        airgram.api.sendMessage({
          chatId: update.chatId,
          inputMessageContent: {
            _: 'inputMessageText',
            text: await parseTextEntities(msg)
          }
        })
      }

      events.on('uploadFile', onFileUpload)

      events.once('videoUploaded', () => {
        clearInterval(interval)
        events.removeListener('uploadFile', onFileUpload)
        resolve()
      })
      events.once('videoUploadFailed', (update) => {
        clearInterval(interval)
        events.removeListener('uploadFile', onFileUpload)
        reject(update)
      })
    })
  } catch (err) {
    const { errorMessage } = err as UpdateMessageSendFailed
    await airgram.api.sendMessage({
      chatId: update.chatId,
      inputMessageContent: {
        _: 'inputMessageText',
        text: await parseTextEntities(
          `Error while uploading the video!\n\n${errorMessage}`
        )
      }
    })
    return
  }

  await airgram.api.sendMessage({
    chatId: update.chatId,
    inputMessageContent: {
      _: 'inputMessageText',
      text: await parseTextEntities(`Done!`)
    }
  })

  console.log(`Video uploaded!`)
}
