import { checkVideos } from '@src/check-videos'
import { env } from '@src/lib/env'
import { cancelUpload } from '@src/model/common'
import { botClient } from '@src/tg-api'
import { Composer } from 'grammy'
import { onlySuperAdmin } from 'grammy-middlewares'

const composer = new Composer()

composer.use(onlySuperAdmin(env.ADMIN_ID)).command('cancel', (ctx) => {
  cancelUpload()
})

botClient.use(composer.middleware())
