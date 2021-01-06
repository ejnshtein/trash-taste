import 'module-alias/register'
import path from 'path'
import { scheduleJob } from 'node-schedule'

import { YTFeedItem } from '@type/youtube'
import { processVideo } from '@src/process-video'
import { env } from '@lib/env'
import { rmdirSafe } from '@lib/rmdir-safe'
import { $items, removeItem, setItems } from './store'
import { loadFeed } from './lib/rss-parser'

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
    for (const item of newItems) {
      await processVideo(item['yt:videoId'])
    }
  }

  const outdatedItems = items.filter(
    (e) => !feedItems.some((i) => i.id === e.id)
  )

  if (outdatedItems) {
    removeItem(outdatedItems.map((e) => e.id))
  }
}

async function main(): Promise<void> {
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
}

main()
