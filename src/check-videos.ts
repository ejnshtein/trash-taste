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
    // return
  }

  if (process.argv.includes('--upload-last-ep')) {
    items.shift()
    await checkVideos()
  }
}

export async function uploadLastEpisode(): Promise<void> {
  items.shift()

  return checkVideos()
}

export async function checkVideos(): Promise<void> {
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
  }

  items = feedItems.map(({ video: { id } }) => id)
}
