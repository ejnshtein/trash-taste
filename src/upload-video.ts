import { Error, UpdateNewCallbackQuery } from 'airgram'
import { getVideoUrlFromTextEntities } from './lib/get-video-url-from-text-entities'
import { airgram, parseTextEntities } from './tg-api'

export const uploadVideo = async (
  update: UpdateNewCallbackQuery
): Promise<Error | void> => {
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

  return {
    _: 'error',
    code: 404,
    message: 'This method is not available yet :('
  }
}
