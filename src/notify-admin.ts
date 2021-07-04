import { Error, Message, toObject } from 'airgram'
import { NewVideoNotified } from '../types'
import { ADMIN_ID } from './lib/env'
import { airgram, parseTextEntities } from './tg-api'

export const notifyAdmin = async (
  video: NewVideoNotified,
  message: Message | Error
): Promise<void> => {
  let messageText = ''

  if (message._ === 'error') {
    messageText = `Got an error when trying to send message to the channel:\n${message.message}\n\n${message.code}`
  } else {
    messageText = `New video published successfully!\n\n<a href="${video.video.link}"><b>${video.video.title}</b></a>\n\nDo you want to upload audio/video file?`
  }

  const text = await parseTextEntities(messageText)
  const { id } = toObject(
    await airgram.api.getChat({
      chatId: parseInt(ADMIN_ID)
    })
  )
  const { response } = await airgram.api.sendMessage({
    chatId: id,
    inputMessageContent: {
      _: 'inputMessageText',
      text
    },
    replyMarkup: {
      _: 'replyMarkupInlineKeyboard',
      rows: [
        [
          {
            _: 'inlineKeyboardButton',
            text: 'Upload video',
            type: {
              _: 'inlineKeyboardButtonTypeCallback',
              data: Buffer.from('uploadvideo').toString('base64')
            }
          },
          {
            _: 'inlineKeyboardButton',
            text: 'Upload audio',
            type: {
              _: 'inlineKeyboardButtonTypeCallback',
              data: Buffer.from('uploadaudio').toString('base64')
            }
          }
        ]
      ]
    }
  })

  if (response._ === 'error') {
    console.log(
      `Got an error trying to send message!\n\n${response.code}\n\n${response.message}`
    )
  }
}
