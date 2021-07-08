export interface MediaGroup {
  'media:title': string[]
  'media:content': {
    $: {
      url: string
      type: string
      width: string
      height: string
    }
  }[]
  'media:thumbnail': {
    $: {
      url: string
      width: string
      height: string
    }
  }[]
  'media:description': string[]
  'media:community': {
    'media:starRating': {
      $: {
        count: string
        average: string
        min: string
        max: string
      }
    }[]
    'media:statistics': {
      $: {
        views: string
      }
    }[]
  }[]
}

export interface YTFeedItem {
  id: string
  title: string
  author: string
  'yt:videoId': string
  'yt:channelId': string
  pubDate: string
  isoDate: string
  'media:group': MediaGroup[]
  updated: string
}