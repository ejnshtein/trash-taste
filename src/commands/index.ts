import { ADMIN_ID } from '@lib/env'
import { airgram, parseTextEntities } from '@src/tg-api'
import { uploadLastEpisode } from './upload-last-ep'
import { cleanupTMPDir } from './cleanup'

airgram.on('updateNewMessage', async (msg) => {
  const { content } = msg.update.message
  switch (content._) {
    case 'messageText': {
      await Promise.all(
        content.text.entities.map(async (entity) => {
          switch (entity._) {
            case 'textEntity': {
              switch (entity.type._) {
                case 'textEntityTypeBotCommand': {
                  if (msg.update.message.chatId !== parseInt(ADMIN_ID)) {
                    return airgram.api.sendMessage({
                      chatId: msg.update.message.chatId,
                      inputMessageContent: {
                        _: 'inputMessageText',
                        text: await parseTextEntities(`Fuck off!`)
                      }
                    })
                  }
                  switch (content.text.text) {
                    case '/uploadlastep': {
                      await uploadLastEpisode()
                      break
                    }
                    case '/cleanup': {
                      await cleanupTMPDir()
                      await airgram.api.sendMessage({
                        chatId: msg.update.message.chatId,
                        inputMessageContent: {
                          _: 'inputMessageText',
                          text: await parseTextEntities(`Cleaned!`)
                        }
                      })
                      break
                    }
                  }
                }
              }
              break
            }
          }
        })
      )
      break
    }
  }
})
