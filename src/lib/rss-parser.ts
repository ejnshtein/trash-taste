import { YTFeedItem } from '@src/type/youtube'
import RssParser from 'rss-parser'
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

export async function loadFeed(): Promise<YTFeedItem[]> {
  const data = await parser.parseURL(
    `https://www.youtube.com/feeds/videos.xml?channel_id=${process.env.YT_CHANNEL_ID}`
  )
  return (data.items as unknown) as YTFeedItem[]
}
