import { checkVideos } from '@src/check-videos'
import { env } from '@src/lib/env'
import { botClient } from '@src/tg-api'
import { Composer } from 'grammy'

const composer = new Composer()

const filteredUpdates = composer.filter(
  (ctx) => ctx.message?.chat?.id === env.ADMIN_ID
)

filteredUpdates.command('uploadlastep', async (ctx) => {
  try {
    await checkVideos({ uploadLastEp: true })
  } catch (e) {
    await ctx.reply(`Error: ${e.message}`)
  }
})

botClient.use(composer)
