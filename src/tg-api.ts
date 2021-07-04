import { Airgram, Auth, FormattedText } from 'airgram'
import path from 'path'
import { TG_API_HASH, TG_API_ID } from './lib/env'

const tdlibAbsolutePath = path.join('/usr', 'local', 'lib', 'libtdjson.so')

export const airgram = new Airgram({
  apiId: parseInt(TG_API_ID),
  apiHash: TG_API_HASH,
  databaseDirectory: './tdl-db',
  filesDirectory: './tdl-files',
  logVerbosityLevel: 0,
  enableStorageOptimizer: true,
  command: tdlibAbsolutePath,
  databaseEncryptionKey: Buffer.from(TG_API_HASH).toString('base64')
})

airgram.use(
  new Auth({
    token: process.env.TOKEN
  })
)

const cachedChatIds = new Map<string, number>()

export const getChatId = async (
  username = process.env.TELEGRAM_CHANNEL_ID
): Promise<number> => {
  if (cachedChatIds.has(username)) {
    return cachedChatIds.get(username)
  }
  const { response } = await airgram.api.searchPublicChat({
    username
  })
  if (response._ === 'error') {
    throw new Error('Channel not found')
  }

  cachedChatIds.set(username, response.id)

  return response.id
}

export const parseTextEntities = async (
  text: string
): Promise<FormattedText> => {
  const { response } = await airgram.api.parseTextEntities({
    parseMode: {
      _: 'textParseModeHTML'
    },
    text
  })
  if (response._ === 'error') {
    throw new Error(response.message)
  }

  return response
}
