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
