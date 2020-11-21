import 'module-alias/register'
import path from 'path'
import * as NodeSchedule from 'node-schedule'
import RssParser from 'rss-parser'

import { YTFeedItem } from '@type/youtube'
import { processVideo } from '@src/process-video'
import { env } from '@lib/env'
import { rmdirSafe } from '@lib/rmdir-safe'
import { $items, removeItem, setItems } from './store'

const { scheduleJob } = NodeSchedule
const parser = new RssParser({
  customFields: {
    item: [
      'description',
      'guid',
      'yt:videoId',
      'yt:channelId',
      'media:group',
      'media:title',
      'media:content',
      'media:thumbnail',
      'media:description',
      'media:community',
      'media:starRating',
      'media:statistics'
    ]
  }
})

async function prepareFs(): Promise<void> {
  const feedItems = await loadFeed()
  if (env('NODE_ENV').is('development')) {
    setItems(
      feedItems.slice(1).map((item) => ({
        id: item['yt:videoId'],
        sendFilesToTg: true,
        sendMessageToTg: true
      }))
    )
  } else {
    setItems(
      feedItems.map((item) => ({
        id: item['yt:videoId'],
        sendFilesToTg: true,
        sendMessageToTg: true
      }))
    )
  }
  await rmdirSafe(path.resolve('./.tmp'))
  console.log(path.resolve('./.tmp'), 'removed')
}

async function loadFeed(): Promise<YTFeedItem[]> {
  const data = await parser.parseURL(
    `https://www.youtube.com/feeds/videos.xml?channel_id=${process.env.YT_CHANNEL_ID}`
  )
  return (data.items as unknown) as YTFeedItem[]
}

async function checkVideos() {
  const items = $items.getState()
  const feedItems = await loadFeed()

  const newItems: YTFeedItem[] = feedItems.filter(
    (item) =>
      !items.some((e) => e.id === item['yt:videoId']) ||
      !items.find((e) => e.id === item['yt:videoId']).sendFilesToTg ||
      !items.find((e) => e.id === item['yt:videoId']).sendMessageToTg
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

prepareFs().then(() => {
  if (env('NODE_ENV').is('development')) {
    checkVideos()
    return
  }

  scheduleJob('*/5 * * * *', checkVideos)
})
