import { uploadLastEpisode } from '@src/check-videos'
import { ADMIN_ID } from '@src/lib/env'
import { airgram, parseTextEntities } from '@src/tg-api'

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
                      uploadLastEpisode()
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
