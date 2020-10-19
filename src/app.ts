import 'module-alias/register'
import * as NodeSchedule from 'node-schedule'
import * as HtmlEntities from 'html-entities'
import RssParser from 'rss-parser'
import { Telegram } from 'telegraf'

import { sleep } from '@lib/sleep'
import { YTFeedItem } from '@type/youtube'
import { processVideo } from './video'
import { env } from '@lib/env'

const { AllHtmlEntities } = HtmlEntities
const { scheduleJob } = NodeSchedule
const { decode } = new AllHtmlEntities()
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

const telegram = new Telegram(process.env.TOKEN)

interface Feed {
  items: string[]
}

const feed: Feed = {
  items: []
}

loadFeed().then((data) => {
  feed.items = data.map((el) => el.id)
})

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

  newVideos.push(newItems[0])

  feed.items = newItems.map((el) => el.id)
  if (newVideos.length) {
    for (const video of newVideos) {
      await sleep(1500)
      await processVideo(video['yt:videoId'])
      // console.log(videoInfo)
      // await sendMessage(post)
    }
  }
}

if (env('NODE_ENV').is('development')) {
  checkVideos()
}
scheduleJob('*/5 * * * *', checkVideos)

async function sendMessage(post: YTFeedItem) {
  let messageText = `<b>${decode(post.title)
    .replace(/</gi, '&lt;')
    .replace(/>/gi, '&gt;')
    .replace(/&/gi, '&amp;')}</b>\n`

  messageText += `\nyoutu.be/${post['yt:videoId']}`

  await telegram.sendMessage(process.env.TELEGRAM_CHANNEL_ID, messageText, {
    parse_mode: 'HTML'
  })
}
