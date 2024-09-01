import '@src/handle-callback-query'
import '@src/commands'

import { botClient } from './tg-api'
// import { scheduleJob } from 'node-schedule'

// import { checkVideos, init } from '@src/check-videos'

// eslint-disable-next-line no-void,prettier/prettier
void async function main(): Promise<void> {
  console.log(await botClient.api.getMe())

  await Promise.all([
    botClient.api.setMyCommands([
      {
        command: 'uploadlastep',
        description: 'Upload last episode'
      },
      {
        command: 'cleanup',
        description: 'Cleanup tmp folder'
      }
    ])
  ])

  // scheduleJob('*/10 * * * *', () => checkVideos())

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

  botClient.start()

  console.log('Ready!')
  // eslint-disable-next-line prettier/prettier
}()
