import { airgram, getChatId, parseTextEntities } from '@src/tg-api'

export interface SendMessageVideo {
  title: string
  videoId: string
}

export async function sendMessage(video: SendMessageVideo): Promise<void> {
  let messageText = `<b>${video.title
    .replace(/</gi, '&lt;')
    .replace(/>/gi, '&gt;')
    .replace(/&/gi, '&amp;')}</b>\n`

  messageText += `\nyoutu.be/${video.videoId}`

  const chatId = await getChatId()

  const { text, entities } = await parseTextEntities(messageText)

  await airgram.api.sendMessage({
    chatId,
    inputMessageContent: {
      _: 'inputMessageText',
      text: {
        _: 'formattedText',
        text,
        entities
      }
    }
  })
}
