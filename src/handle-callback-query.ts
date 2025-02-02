import { onlySuperAdmin } from 'grammy-middlewares'
import { getVideoUrlFromTextEntities } from '@src/lib/get-video-url-from-text-entities'
import { botClient } from '@src/tg-api'
import { uploadAudio } from '@src/upload-audio'
import { uploadVideo } from '@src/upload-video'
import { uploadVideoAndAudio } from '@src/upload-video-and-audio'
import { env } from '@src/lib/env'

botClient
  .use(onlySuperAdmin(env.ADMIN_ID))
  .on('callback_query', async (ctx) => {
    const { update } = ctx
    const { callback_query: callbackQuery } = update

    if (callbackQuery.data) {
      const data =
        /^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)?$/.test(
          callbackQuery.data
        )
          ? Buffer.from(callbackQuery.data, 'base64').toString('utf-8')
          : callbackQuery.data
      switch (data) {
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
        case 'uploadvideoandaudio': {
          uploadVideoAndAudio({
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
