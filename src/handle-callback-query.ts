import { airgram, parseTextEntities } from './tg-api'
import { uploadAudio } from './upload-audio'
import { uploadVideo } from './upload-video'

airgram.on('updateNewCallbackQuery', async (msg) => {
  const { update } = msg
  if (update.payload._ === 'callbackQueryPayloadData') {
    switch (Buffer.from(update.payload.data, 'base64').toString('utf-8')) {
      case 'uploadvideo': {
        await airgram.api.answerCallbackQuery({
          callbackQueryId: update.id,
          text: 'Uploading video...'
        })
        const error = await uploadVideo(update)
        if (error) {
          await airgram.api.sendMessage({
            chatId: update.chatId,
            inputMessageContent: {
              _: 'inputMessageText',
              text: await parseTextEntities(
                `Got an error!\n\nCode: ${error.code}\n\n${error.message}`
              )
            }
          })
        }
        break
      }
      case 'uploadaudio': {
        await airgram.api.answerCallbackQuery({
          callbackQueryId: update.id,
          text: 'Uploading audio...'
        })
        const error = await uploadAudio(update)
        if (error) {
          await airgram.api.sendMessage({
            chatId: update.chatId,
            inputMessageContent: {
              _: 'inputMessageText',
              text: await parseTextEntities(
                `Got an error!\n\nCode: ${error.code}\n\n${error.message}`
              )
            }
          })
        }
        break
      }
      default: {
        await airgram.api.answerCallbackQuery({
          callbackQueryId: update.id,
          text: `Sorry, I don't know what this button do :(`
        })
      }
    }
  }
})

// airgram.on('updateNewMessage', async (msg) => {
//   console.log(`Got new message! ${msg.update.message.id}`)
// })
