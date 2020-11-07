import 'module-alias/register'
import path from 'path'
import * as NodeSchedule from 'node-schedule'
import RssParser from 'rss-parser'

import { YTFeedItem } from '@type/youtube'
// import { processVideo } from '@src/video'
import { processVideo } from '@src/process-video'
import { env } from '@lib/env'
import { rmdirSafe } from '@lib/rmdir-safe'
import { airgram, getChatId, parseTextEntities } from '@src/tg-api'

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

console.log(process.env.NODE_ENV)

interface Feed {
  items: string[]
}

const feed: Feed = {
  items: []
}

async function prepareFs(): Promise<void> {
  const data = await loadFeed()
  feed.items = data.map((el) => el.id)
  if (env('NODE_ENV').is('development')) {
    feed.items.shift()
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
  const newItems = await loadFeed()
  const newVideos = newItems
    .filter((el) => !feed.items.includes(el.id))
    .reverse()

  feed.items = newItems.map((el) => el.id)
  if (newVideos.length) {
    for (const video of newVideos) {
      await sendMessage(video)
      await processVideo(video['yt:videoId'])
    }
  }
}

prepareFs().then(() => {
  if (env('NODE_ENV').is('development')) {
    checkVideos()
  }

  scheduleJob('*/5 * * * *', checkVideos)
})

async function sendMessage(post: YTFeedItem) {
  let messageText = `<b>${post.title
    .replace(/</gi, '&lt;')
    .replace(/>/gi, '&gt;')
    .replace(/&/gi, '&amp;')}</b>\n`

  messageText += `\nyoutu.be/${post['yt:videoId']}`

  const chatId = await getChatId()

  const { text, entities } = await parseTextEntities(messageText)

  await airgram.api.sendMessage({
    chatId,
    inputMessageContent: {
      _: 'inputMessageText',
      text: {
        _: 'formattedText',
        text,
        entities
      }
    }
  })
}
