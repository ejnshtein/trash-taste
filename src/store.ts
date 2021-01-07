import { createEvent, createStore } from 'effector'
import { env } from './lib/env'

export interface PodcastItem {
  /**
   * Podcast youtube id
   */
  id: string

  sendFilesToTg?: boolean

  processing?: boolean
}

export const setItems = createEvent<PodcastItem[]>()
export const addItem = createEvent<PodcastItem | PodcastItem[]>()
export const removeItem = createEvent<string | string[]>()
export const editItem = createEvent<PodcastItem>()
export const $items = createStore<PodcastItem[]>([])
  .on(removeItem, (items, item) => {
    if (typeof item === 'string') {
      return items.filter(({ id }) => id !== item)
    }
    return items.filter(({ id }) => !item.some((i) => i === id))
  })
  .on(addItem, (items, payload) => {
    if (!Array.isArray(payload)) {
      payload = [payload]
    }
    payload.forEach((item) => {
      if (!items.some((e) => e.id === item.id)) {
        items.push(item)
      }
    })

    return [...items]
  })
  .on(setItems, (_, items) =>
    items.map((el) => ({
      sendFilesToTg: false,
      sendMessageToTg: false,
      ...el
    }))
  )
  .on(editItem, (items, item) => {
    const foundItem = items.find((i) => i.id === item.id)

    if (foundItem) {
      for (const [key, value] of Object.entries(item)) {
        foundItem[key] = value
      }
    }

    return [...items]
  })
export const $processingPodcast = $items.map((items) =>
  items.find((item) => item.processing)
)

if (env('NODE_ENV').is('development')) {
  const sub = $items.watch((items) => {
    if (items.length > 0) {
      sub()
      console.log(items)
    }
  })
  $processingPodcast.watch(console.log)
}
