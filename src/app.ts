import * as NodeSchedule from 'node-schedule'
import * as HtmlEntities from 'html-entities'
import * as RssParser from 'rss-parser'
import { Telegram } from 'telegraf'

import { sleep } from './lib/sleep'
import { YTFeedItem } from './type/youtube'

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

async function loadFeed(): Promise<YTFeedItem[]> {
  const data = await parser.parseURL(
    `https://www.youtube.com/feeds/videos.xml?channel_id=${process.env.YT_CHANNEL_ID}`
  )
  return (data.items as unknown) as YTFeedItem[]
}

scheduleJob('*/5 * * * *', async () => {
  const newItems = await loadFeed()
  const newPosts = newItems
    .filter((el) => !feed.items.includes(el.id))
    .reverse()

  feed.items = newItems.map((el) => el.id)
  if (newPosts.length) {
    for (const post of newPosts) {
      await sleep(1500)
      await sendMessage(post)
    }
  }
})

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
