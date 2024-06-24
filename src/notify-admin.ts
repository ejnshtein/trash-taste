import { NewVideoNotified } from '../types'
import { env } from './lib/env'
import { botClient } from './tg-api'
import { Message } from 'grammy/types'

const isError = (message: Message.TextMessage | Error): message is Error =>
  message instanceof Error

export const notifyAdmin = async (
  video: NewVideoNotified,
  message: Message.TextMessage | Error
): Promise<void> => {
  let messageText = ''

  if (isError(message)) {
    messageText = `Got an error when trying to send message to the channel:\n${message.message}`
  } else {
    messageText = `New video published successfully!\n\n<a href="${video.video.link}"><b>${video.video.title}</b></a>\n\nDo you want to upload audio/video file?`
  }

  try {
    await botClient.api.sendMessage(env.ADMIN_ID, messageText, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: 'Upload video',
              callback_data: Buffer.from('uploadvideo').toString('base64')
            },
            {
              text: 'Upload audio',
              callback_data: Buffer.from('uploadaudio').toString('base64')
            }
          ]
        ]
      }
    })
  } catch (e) {
    if (e instanceof Error) {
      console.log(
        `Got an error trying to send message!\n\n${e.name}\n\n${e.message}`
      )
    }
    console.log(e)
  }
}
