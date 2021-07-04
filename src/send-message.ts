import { TELEGRAM_CHANNEL_ID } from '@src/lib/env'
import { airgram, parseTextEntities } from '@src/tg-api'
import { toObject } from 'airgram'
import { NewVideoNotified } from '../types'
import { notifyAdmin } from './notify-admin'

export const sendMessageToChannel = async (
  video: NewVideoNotified
): Promise<void> => {
  const { id } = toObject(
    await airgram.api.getChat({
      chatId: parseInt(TELEGRAM_CHANNEL_ID)
    })
  )
  const { response } = await airgram.api.sendMessage({
    chatId: id,
    inputMessageContent: {
      _: 'inputMessageText',
      text: await parseTextEntities(
        `<b>${video.video.title}</b>\n\n<a href="https://youtu.be/${video.video.id}">youtu.be/${video.video.id}</a>`
      ),
      disableWebPagePreview: false
    }
  })

  await notifyAdmin(video, response)
}
