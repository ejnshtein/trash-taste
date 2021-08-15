import 'module-alias/register'

import { airgram } from './tg-api'
import { toObject } from 'airgram'
import { scheduleJob } from 'node-schedule'

import './handle-callback-query'
import './commands'
import { checkVideos, init } from '@src/check-videos'

// eslint-disable-next-line no-void,prettier/prettier
void async function main(): Promise<void> {
  console.log(toObject(await airgram.api.getMe()))

  await init()

  scheduleJob('*/10 * * * *', checkVideos)

  async function closeGracefully(signal: NodeJS.SignalsListener) {
    console.log(`*^!@4=> Received signal to terminate: ${signal}`)

    // await notifier.unsubscribe(YT_CHANNEL_ID)
    await airgram.api.logOut()
    process.exit(0)
  }
  process.on('SIGINT', closeGracefully)
  process.on('SIGTERM', closeGracefully)

  console.log('Ready!')
  // eslint-disable-next-line prettier/prettier
}()
