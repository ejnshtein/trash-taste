import { loadFeed } from '@lib/rss-parser'
import { sendMessageToChannel } from '@src/send-message'
import { NODE_ENV } from './lib/env'

let items: string[] = []

export async function init(): Promise<void> {
  const feedItems = await loadFeed()

  if (items.length === 0) {
    items.push(...feedItems.map(({ video: { id } }) => id))
  }

  if (NODE_ENV === 'development') {
    await checkVideos()
  }
}

export async function checkVideos({
  uploadLastEp = false
}: { uploadLastEp?: boolean } = {}): Promise<void> {
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
  } else {
    if (uploadLastEp) {
      await sendMessageToChannel(feedItems[0])
    }

    return
  }

  items = feedItems.map(({ video: { id } }) => id)
}
