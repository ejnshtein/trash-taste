import { checkVideos } from '@src/check-videos'
import { env } from '@src/lib/env'
import { botClient } from '@src/tg-api'
import { Composer } from 'grammy'
import { onlySuperAdmin } from 'grammy-middlewares'

const composer = new Composer()

composer
  .use(onlySuperAdmin(env.ADMIN_ID))
  .command('uploadlastep', async (ctx) => {
    try {
      await checkVideos({ uploadLastEp: true })
    } catch (e) {
      await ctx.reply(`Error: ${e.message}`)
    }
  })

botClient.use(composer.middleware())
