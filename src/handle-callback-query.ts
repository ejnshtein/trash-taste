import { getVideoUrlFromTextEntities } from './lib/get-video-url-from-text-entities'
import { botClient } from './tg-api'
import { uploadAudio } from './upload-audio'
import { uploadVideo } from './upload-video'

botClient.on('callback_query', async (ctx) => {
  const { update } = ctx
  const { callback_query: callbackQuery } = update

  if (callbackQuery.data) {
    switch (callbackQuery.data) {
      case 'uploadvideo': {
        uploadVideo({
          chatId: ctx.chatId,
          replyToMessageId: callbackQuery.message.message_id,
          callbackQueryId: callbackQuery.id,
          videoUrl: getVideoUrlFromTextEntities(callbackQuery.message)
        })
        break
      }
      case 'uploadaudio': {
        uploadAudio({
          chatId: ctx.chatId,
          replyToMessageId: callbackQuery.message.message_id,
          callbackQueryId: callbackQuery.id,
          videoUrl: getVideoUrlFromTextEntities(callbackQuery.message)
        })
        break
      }
      default: {
        await ctx.answerCallbackQuery({
          text: `Sorry, I don't know what this button do :(`
        })
      }
    }
  }
})
