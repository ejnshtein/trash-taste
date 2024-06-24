import 'module-alias/register'

import { botClient } from './tg-api'
import { scheduleJob } from 'node-schedule'

import './handle-callback-query'
import './commands'
import { checkVideos, init } from '@src/check-videos'

// eslint-disable-next-line no-void,prettier/prettier
void async function main(): Promise<void> {
  console.log(await botClient.api.getMe())

  await init()

  scheduleJob('*/10 * * * *', () => checkVideos())

  // shut down server
  async function shutdown() {
    process.exit()
  }

  // quit on ctrl-c when running docker in terminal
  process.on('SIGINT', function onSigint() {
    console.info(
      'Got SIGINT (aka ctrl-c in docker). Graceful shutdown ',
      new Date().toISOString()
    )
    shutdown()
  })

  // quit properly on docker stop
  process.on('SIGTERM', function onSigterm() {
    console.info(
      'Got SIGTERM (docker container stop). Graceful shutdown ',
      new Date().toISOString()
    )
    shutdown()
  })

  botClient.catch((err) => {
    console.error('Error:', err)
  })

  botClient.start()

  console.log('Ready!')
  // eslint-disable-next-line prettier/prettier
}()
