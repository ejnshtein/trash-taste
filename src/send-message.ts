import { env } from '@src/lib/env'
import { NewVideoNotified } from '../types'
import { notifyAdmin } from './notify-admin'
import { botClient } from './tg-api'

export const sendMessageToChannel = async (
  video: NewVideoNotified
): Promise<void> => {
  const response = await botClient.api.sendMessage(
    env.TELEGRAM_CHANNEL_ID,
    `<b>${video.video.title}</b>\n\n<a href="https://youtu.be/${video.video.id}">youtu.be/${video.video.id}</a>`,
    {
      parse_mode: 'HTML',
      link_preview_options: {
        is_disabled: false,
        url: `https://youtu.be/${video.video.id}`
      }
    }
  )
  await notifyAdmin(video, response)
}
