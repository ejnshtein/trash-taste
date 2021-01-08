import 'module-alias/register'
import path from 'path'
import { scheduleJob } from 'node-schedule'

import { YTFeedItem } from '@type/youtube'
import { env } from '@lib/env'
import { rmdirSafe } from '@lib/rmdir-safe'
import { loadFeed } from '@lib/rss-parser'
import { sendMessage } from '@lib/send-message'

import { processVideo } from '@src/process-video'
import { $items, addItem, removeItem, setItems } from '@src/store'

async function checkVideos() {
  const items = $items.getState()
  const feedItems = await loadFeed()

  if (feedItems.length === 0) {
    return
  }

  const newItems: YTFeedItem[] = feedItems.filter(
    (item) =>
      !items.some((e) => e.id === item['yt:videoId']) ||
      !items.find((e) => e.id === item['yt:videoId']).sendFilesToTg ||
      !items.find((e) => e.id === item['yt:videoId']).processing
  )

  if (newItems.length > 0) {
    addItem(newItems)
    for (const item of newItems) {
      await sendMessage({ title: item.title, videoId: item['yt:videoId'] })
      await processVideo(item['yt:videoId'])
    }
  }

  const outdatedItems = items.filter(
    (e) => !feedItems.some((i) => i.id === e.id)
  )

  if (outdatedItems.length > 0) {
    removeItem(outdatedItems.map((e) => e.id))
  }
}

// eslint-disable-next-line no-void,prettier/prettier
void async function main(): Promise<void> {
  const feedItems = await loadFeed()
  if (env('NODE_ENV').is('development')) {
    setItems(
      feedItems.slice(1).map((item) => ({
        id: item['yt:videoId'],
        sendFilesToTg: true,
        sendMessageToTg: true,
        processing: false
      }))
    )
  } else {
    setItems(
      feedItems.map((item) => ({
        id: item['yt:videoId'],
        sendFilesToTg: true,
        sendMessageToTg: true,
        processing: false
      }))
    )
  }
  await rmdirSafe(path.resolve('./.tmp'))
  console.log(path.resolve('./.tmp'), 'removed')

  if (env('NODE_ENV').is('development')) {
    checkVideos()
    return
  }

  scheduleJob('*/10 * * * *', checkVideos)
  // eslint-disable-next-line prettier/prettier
}()
