import EventEmitter from 'events'
import * as e from 'express'
import { server } from './server'
import crypto from 'crypto'
import { xmlbodyparser } from './xmlParser'
import { request } from 'smol-request'
import { NewVideoNotified } from '../../types'

/**
 * Constants
 */
export const baseTopic =
  'https://www.youtube.com/xml/feeds/videos.xml?channel_id='

export interface YoutubeNotiferOptions {
  /**
   * Your ip/domain name that will be used as a callback URL by the hub
   */
  hubCallback: string

  /**
   * The secret for the requests to hub
   *
   * @default undefined
   */
  secret?: string

  /**
   * If you are going to use the Notifier with a middleware
   *
   * @default false
   */
  middleware?: boolean

  /**
   * An open port on your system to listen on. Defaults to port 3000 or undefined
   *
   * @default 3000
   */
  port?: number

  /**
   * The path on which server will interact with the hub
   *
   * @default '/'
   */
  path?: string

  /**
   * The hub url. It is advised not to change this.
   *
   * @default 'https://pubsubhubbub.appspot.com/''
   */
  hubUrl?: string
}

export class YouTubeNotifier extends EventEmitter {
  private hubCallback: string
  private hubUrl: string
  private secret: string
  private middleware: boolean
  private port: number
  public path: string
  private server: e.Express | null
  private _received: string[]
  constructor(options: YoutubeNotiferOptions) {
    if (!options.hubCallback) {
      throw new Error('You need to provide the callback URL.')
    }
    super()

    this.hubCallback = options.hubCallback

    this.hubUrl = options.hubUrl || 'https://pubsubhubbub.appspot.com/'

    this.secret = options.secret

    this.middleware = Boolean(options.middleware)

    this.port = options.port || 3000

    this.path = options.path || '/'

    this.server = null

    this._received = []
  }

  /**
   * Create a server and start listening on the port.
   */
  setup(): void {
    if (this.middleware) {
      throw new Error('You cannot setup a server if you are using middleware.')
    }
    if (this.server) {
      throw new Error('The Server has been already setup.')
    }
    this.server = server(this)
    this.server.listen(this.port)
  }

  /**
   * Creates an Express middleware handler for PubSubHubbub
   */
  listener(): e.RequestHandler {
    return (req, res) => {
      xmlbodyparser(req, res, this)
    }
  }

  /**
   * Subsribe to a channel.
   *
   * @param channels The channel id or an array of channel ids to subscribe to
   */
  async subscribe(channels: string | string[]): Promise<void> {
    if (
      !channels ||
      (typeof channels !== 'string' && !Array.isArray(channels))
    ) {
      throw new Error(
        'You need to provide a channel id or an array of channel ids.'
      )
    }
    if (typeof channels === 'string') {
      await this._makeRequest(channels, 'subscribe')
    } else {
      await Promise.all(
        channels.map((channel) => this._makeRequest(channel, 'subscribe'))
      )
    }
  }

  /**
   * Unsubsribe from a channel.
   *
   * @param channels The channel id or an array of channel ids to unsubscribe from
   */
  async unsubscribe(channels: string | string[]): Promise<void> {
    if (
      !channels ||
      (typeof channels !== 'string' && !Array.isArray(channels))
    ) {
      throw new Error(
        'You need to provide a channel id or an array of channel ids.'
      )
    }
    if (typeof channels === 'string') {
      await this._makeRequest(channels, 'unsubscribe')
    } else {
      await Promise.all(
        channels.map((channel) => this._makeRequest(channel, 'unsubscribe'))
      )
    }
  }

  /**
   * Subscribe or unsubscribe to a channel
   * @param channel_id The id of the channel to subscribe or unsubscribe to
   */
  async _makeRequest(
    channelId: string,
    type: 'subscribe' | 'unsubscribe'
  ): Promise<void> {
    const topic = baseTopic + channelId
    const data = {
      'hub.callback': this.hubCallback,
      'hub.mode': type,
      'hub.topic': topic
    }

    if (this.secret) {
      data['hub.secret'] = this.secret
    }

    await request(
      this.hubUrl,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        method: 'POST'
      },
      data
    )
  }

  /**
   * Request handler. Will be fired when a hub opens a connection to the server
   */
  async _onRequest(req: e.Request, res: e.Response): Promise<void> {
    if (req.method === 'GET') {
      this._onGetRequest(req, res)
    } else if (req.method === 'POST') {
      await this._onPostRequest(req, res)
    } else {
      // Reject any other methods
      res.sendStatus(403)
    }
  }

  /**
   * GET request handler for the server. This should be called when the server
   * tries to verify the intent of the subscriber.
   */
  _onGetRequest(req: e.Request, res: e.Response): void {
    const params = new URL(req.url).searchParams

    // Invalid request
    if (!params.get('hub.topic') || !params.get('hub.mode')) {
      return res
        .status(400)
        .set('Content-Type', 'text/plain')
        .end('Bad Request')
    }

    res
      .status(200)
      .set('Content-Type', 'text/plain')
      .end(params.get('hub.challenge'))

    const data: Record<string, string> = {
      type: params.get('hub.mode'),
      channel: params.get('hub.topic').replace(baseTopic, '')
    }

    // Also return lease_seconds if mode is subscribe
    if (params.get('hub.lease_seconds'))
      data.lease_seconds = params.get('hub.lease_seconds')

    this.emit(params.get('hub.mode'), data)
  }

  /**
   * POST request handler. Should be called when the hub tries to notify the subscriber
   * with new data
   */
  async _onPostRequest(
    req: e.Request,
    res: e.Response
  ): Promise<NewVideoNotified | void> {
    const { body } = req

    // Invalid POST
    if (this.secret && !req.headers['x-hub-signature']) {
      res.sendStatus(403)
      return
    }

    // Deleted Video
    if (body.feed['at:deleted-entry']) {
      res.sendStatus(200)
      return
    }

    const {
      feed: { entry }
    } = body
    // Invalid Entry
    if (!entry) {
      res.status(400).set('Content-Type', 'text/plain').end('Bad Request')
      return
    }

    // Match Secret
    if (this.secret) {
      const signatureParts = (
        Array.isArray(req.headers['x-hub-signature'])
          ? req.headers['x-hub-signature'][0]
          : req.headers['x-hub-signature']
      ).split('=')
      const algorithm = (signatureParts.shift() || '').toLowerCase()
      const signature = (signatureParts.pop() || '').toLowerCase()
      let hmac: crypto.Hmac

      try {
        hmac = crypto.createHmac(algorithm, this.secret)
      } catch (E) {
        res.sendStatus(403)
        return
      }

      hmac.update(body)

      // Return a 200 response even if secret did not match
      if (hmac.digest('hex').toLowerCase() !== signature) {
        res.sendStatus(200)
        return
      }
    }

    const vidId = entry[0]['yt:videoid']
    const publishTIme = new Date(entry[0].published[0])
    const updateTime = new Date(entry[0].updated[0])

    if (this._received.includes(vidId)) {
      this._received.splice(this._received.indexOf(vidId), 1)
      res.sendStatus(200)
      return
    }

    if (updateTime.getTime() - publishTIme.getTime() < 300000) {
      this._received.push(vidId)
    }

    const data: NewVideoNotified = {
      video: {
        id: vidId,
        title: entry[0].title[0],
        link: entry[0].link[0].$.href
      },
      channel: {
        id: entry[0]['yt:channelid'][0],
        name: entry[0].author[0].name[0],
        link: entry[0].author[0].uri[0]
      },
      published: publishTIme,
      updated: updateTime
    }

    this.emit('notified', data)

    res.sendStatus(200)

    return data
  }
}
