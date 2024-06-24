import { Bot, GrammyError, HttpError } from 'grammy'
import { env } from './lib/env'

export const botClient = new Bot(env.TOKEN, {
  client: {
    apiRoot: 'http://local-telegram-bot-api:8081'
  }
})

if (env.NODE_ENV !== 'production') {
  botClient.use((ctx, next) => {
    console.log('Received:', ctx.update, env)
    return next()
  })
}

const cachedChatIds = new Map<string, number>()

export const getChatId = async (
  username = process.env.TELEGRAM_CHANNEL_ID
): Promise<number> => {
  if (cachedChatIds.has(username)) {
    return cachedChatIds.get(username)
  }
  let response: Awaited<ReturnType<typeof botClient.api.getChat>>
  try {
    response = await botClient.api.getChat(username)
  } catch (e) {
    if (e instanceof GrammyError) {
      console.error('Error in request:', e.description)
    } else if (e instanceof HttpError) {
      console.error('Could not contact Telegram:', e)
    } else {
      console.error('Unknown error:', e)
    }

    throw new Error('Could not get chat id')
  }

  cachedChatIds.set(username, response.id)

  return response.id
}
