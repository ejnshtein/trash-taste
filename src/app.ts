import 'module-alias/register'

// import { YouTubeNotifier } from './youtube-notification'
// import { request } from 'smol-request'

// import { NewVideoNotified } from '../types'
import { airgram } from './tg-api'
import { NODE_ENV } from './lib/env'
import { sendMessageToChannel } from './send-message'

import './handle-callback-query'
import { toObject } from 'airgram'
import { loadFeed } from './lib/rss-parser'
import { scheduleJob } from 'node-schedule'

let items: string[] = []

async function checkVideos() {
  const feedItems = await loadFeed()

  if (items.length === 0) {
    items.push(...feedItems.map(({ video: { id } }) => id))
    return
  }

  const newItems = feedItems.filter((item) => !items.includes(item.video.id))

  if (newItems.length > 0) {
    for (const item of newItems) {
      await sendMessageToChannel(item)
    }
  }

  items = feedItems.map(({ video: { id } }) => id)
}

// eslint-disable-next-line no-void,prettier/prettier
void async function main(): Promise<void> {
  console.log(toObject(await airgram.api.getMe()))
  // const {
  //   data: { ip }
  // } = await request<{ ip: string }, 'json'>(
  //   'https://api64.ipify.org/?format=json',
  //   {
  //     responseType: 'json'
  //   }
  // )

  // const notifier = new YouTubeNotifier({
  //   hubCallback: `http://${ip}/`,
  //   port: Number.parseInt(process.env.PORT || '0') || 3000,
  //   // secret: '',
  //   path: `/youtube/${YT_CHANNEL_ID}`
  // })

  // notifier.setup()

  // notifier.on('notified', async (data: NewVideoNotified) => {
  //   console.log('New Video')
  //   console.log(
  //     `${data.channel.name} just uploaded a new video titled: ${data.video.title}`
  //   )

  //   await sendMessageToChannel(data)
  // })

  // await notifier.subscribe(YT_CHANNEL_ID)
  const feedItems = await loadFeed()

  if (items.length === 0) {
    items.push(...feedItems.map(({ video: { id } }) => id))
  }

  if (NODE_ENV === 'development') {
    await checkVideos()
    // return
  }

  if (process.argv.includes('--upload-last-ep')) {
    items.shift()
    await checkVideos()
  }

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
