import { NewVideoNotified } from '../../types'
import RssParser from 'rss-parser'

const parser = new RssParser({
  customFields: {
    item: [
      'description',
      'guid',
      'author',
      'name',
      'updated',
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

export async function loadFeed(): Promise<NewVideoNotified[]> {
  try {
    const data = await parser.parseURL(
      `https://www.youtube.com/feeds/videos.xml?channel_id=${process.env.YT_CHANNEL_ID}`
    )
    return data.items.map((item) => ({
      channel: {
        id: item['yt:channelId'],
        link: `https://www.youtube.com/user/${item['yt:channelId']}`,
        name: item.author
      },
      published: new Date(item.pubDate),
      updated: new Date(item.updated),
      video: {
        id: item['yt:videoId'],
        link: `https://www.youtube.com/watch?v=${item['yt:videoId']}`,
        title: item.title
      }
    }))
  } catch (e) {
    console.error(
      `Error while requesting RSS feed for the channel https://www.youtube.com/channel/${process.env.YT_CHANNEL_ID}`,
      e
    )

    return []
  }
}
