import './ffmetadata'
export interface NewVideoNotified {
  video: {
    id: string
    title: string
    link: string
  }
  channel: {
    id: string
    name: string
    link: string
  }
  published: Date
  updated: Date
}

declare module 'express' {
  interface Request {
    rawBody?: unknown
    _body?: unknown
  }
}
