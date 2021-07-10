import {
  Error,
  SendMessageParams,
  UpdateFile,
  UpdateMessageSendFailed,
  UpdateNewCallbackQuery
} from 'airgram'
import path from 'path'
import * as ytdl from 'ytdl-core'
import { downloadAudio } from './lib/download-audio'
import { encodeAudio } from './lib/encode-audio'
import { TELEGRAM_CHANNEL_ID } from './lib/env'
import { getVideoUrlFromTextEntities } from './lib/get-video-url-from-text-entities'
import { airgram, parseTextEntities } from './tg-api'
import { addAudioMetadata } from './lib/add-audio-metadata'
import { events } from './handle-file-upload'

export const uploadAudio = async (
  update: UpdateNewCallbackQuery
): Promise<Error | void> => {
  console.log('(1/5) Processing audio...')
  const { response: messageToUpdate } = await airgram.api.sendMessage({
    chatId: update.chatId,
    inputMessageContent: {
      _: 'inputMessageText',
      text: await parseTextEntities(`(1/5) Processing audio...`)
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
      inputMessageContent: {
        _: 'inputMessageText',
        text: await parseTextEntities(
          `Unable to parse video url from this message :(`
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

  await airgram.api.getChat({
    chatId: messageToUpdate.chatId
  })

  await airgram.api.sendMessage({
    chatId: update.chatId,
    inputMessageContent: {
      _: 'inputMessageText',
      text: await parseTextEntities(`(2/5) Downloading audio...`)
    }
  })

  try {
    console.log('(2/5) Downloading audio...')
    await downloadAudio(videoInfo, format, audioPath)
  } catch (e) {
    await airgram.api.sendMessage({
      chatId: update.chatId,
      inputMessageContent: {
        _: 'inputMessageText',
        text: await parseTextEntities(
          `Ooops!\nGot an error during downloading of the audio: ${e}`
        )
      }
    })
    return
  }

  await airgram.api.sendMessage({
    chatId: update.chatId,
    inputMessageContent: {
      _: 'inputMessageText',
      text: await parseTextEntities(`(3/5) Encoding audio...`)
    }
  })

  let audioMP3path: string
  try {
    console.log('(3/5) Encoding audio...')
    audioMP3path = await encodeAudio(audioPath, format.audioBitrate)
  } catch (e) {
    await airgram.api.sendMessage({
      chatId: update.chatId,
      inputMessageContent: {
        _: 'inputMessageText',
        text: await parseTextEntities(
          `Oooops!\nGot an error during encoding audio file: ${e}`
        )
      }
    })

    return
  }

  await airgram.api.sendMessage({
    chatId: update.chatId,
    inputMessageContent: {
      _: 'inputMessageText',
      text: await parseTextEntities(`(4/5) Adding metadata...`)
    }
  })

  try {
    console.log('(4/5) Adding metadata...')
    await addAudioMetadata(audioMP3path, videoInfo.videoDetails.title)
  } catch (e) {
    await airgram.api.sendMessage({
      chatId: update.chatId,
      inputMessageContent: {
        _: 'inputMessageText',
        text: await parseTextEntities(
          `Oooops!\nGot an error during adding metadata to audio file: ${e}`
        )
      }
    })

    return
  }

  const { response: getChatResponse } = await airgram.api.getChat({
    chatId: parseInt(TELEGRAM_CHANNEL_ID)
  })

  if (getChatResponse._ === 'error') {
    return getChatResponse
  }

  const { id } = getChatResponse

  const { response: searchMessagesResponse } = await airgram.api.searchMessages(
    {
      chatList: {
        _: 'chatListFilter',
        chatFilterId: id
      },
      filter: {
        _: 'searchMessagesFilterUrl'
      },
      limit: 10,
      query: videoInfo.videoDetails.title
    }
  )

  const audioMessage: SendMessageParams = {
    chatId: id,
    inputMessageContent: {
      _: 'inputMessageAudio',
      audio: {
        _: 'inputFileLocal',
        path: audioMP3path
      },
      albumCoverThumbnail: {
        _: 'inputThumbnail',
        thumbnail: {
          _: 'inputFileLocal',
          path: path.join(process.cwd(), 'assets', 'thumb.jpg')
        }
      },
      title: videoInfo.videoDetails.title,
      performer: 'TrashTaste Podcast'
    }
  }

  if (searchMessagesResponse._ === 'messages') {
    if (searchMessagesResponse.totalCount > 0) {
      audioMessage.replyToMessageId = searchMessagesResponse.messages[0].id
    }
  }

  console.log('5/5) Uploading audio...')
  await airgram.api.sendMessage({
    chatId: update.chatId,
    inputMessageContent: {
      _: 'inputMessageText',
      text: await parseTextEntities(`(j/5) Uploading audio...`)
    }
  })

  const { response: newAudioResponse } = await airgram.api.sendMessage(
    audioMessage
  )

  if (newAudioResponse._ === 'error') {
    return newAudioResponse
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

      events.once('audioUploaded', () => {
        clearInterval(interval)
        events.removeListener('uploadFile', onFileUpload)
        resolve()
      })
      events.once('audioUploadFailed', (update) => {
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
          `Error while uploading the audio!\n\n${errorMessage}`
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

  console.log(`Audio uploaded!`)
}
