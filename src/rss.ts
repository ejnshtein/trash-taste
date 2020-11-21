import 'module-alias/register'
import { loadFeed } from '@lib/rss-parser'
import { env } from '@lib/env'
import { createEvent, createStore } from 'effector'
import { scheduleJob } from 'node-schedule'
import { YTFeedItem } from '@src/type/youtube'
import { sendMessage } from '@lib/send-message'

const setItems = createEvent<string[]>()
const $items = createStore<string[]>([]).on(setItems, (_, items) => items)

async function checkVideos() {
  const items = $items.getState()
  const feedItems = await loadFeed()

  const newItems: YTFeedItem[] = feedItems.filter(
    (item) => !items.some((e) => e === item['yt:videoId'])
  )

  if (newItems.length > 0) {
    for (const item of newItems) {
      await sendMessage({ title: item.title, videoId: item['yt:videoId'] })
    }
  }
}
// eslint-disable-next-line no-void
void async function main(): Promise<void> {
  const feedItems = await loadFeed()
  setItems(feedItems.map((item) => item['yt:videoId']))

  if (env('NODE_ENV').is('development')) {
    checkVideos()
    return
  }

  scheduleJob('*/5 * * * *', checkVideos)
}
