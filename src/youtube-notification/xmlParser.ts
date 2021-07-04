/* eslint-disable prettier/prettier */
import xml2js from 'xml2js'
import * as e from 'express'
import { YouTubeNotifier } from './index'

/**
 * Constants
 */
const regexp = /^(text\/xml|application\/([\w!#$%&*`\-.^~]+\+)?xml)$/i

/**
 * Test whether request has body
 *
 * @see connect.utils
 */
export async function xmlbodyparser(req: e.Request, res: e.Response, notifier: YouTubeNotifier): Promise<void> {
  let data = ''

  const parser = new xml2js.Parser({
    async: false,
    explicitArray: true,
    normalize: true,
    normalizeTags: true,
    trim: true
  })

  /**
   * @param {Error} err
   * @param {Object} xml
   */
  function responseHandler(err: Error, xml?: Record<string, string>) {
    if (err) {
      (err as unknown as Record<string, unknown>).status = 400
      return notifier._onRequest(req, res)
    }

    req.body = xml || req.body
    req.rawBody = data
    notifier._onRequest(req, res)
  }

  if (req._body) {
    return notifier._onRequest(req, res)
  }

  req.body = req.body || {}

  if (!hasBody(req) || !regexp.test(mime(req)))
    return notifier._onRequest(req, res)

  req._body = true

  // Explicitly cast incoming to string
  req.setEncoding('utf-8')
  req.on('data', (chunk) => {
    data += chunk
  })

  // In case `parseString` callback never was called, ensure response is sent
  parser.saxParser.onend = () => {
    if (req.complete && req.rawBody === undefined) {
      return responseHandler(null)
    }
  }

  req.on('end', () => {
    // Invalid xml, length required
    if (data.trim().length === 0) {
      return notifier._onRequest(req, res)
    }

    parser.parseString(data, responseHandler)
  })
}

/**
 * Test whether request has body
 *
 * @see connect.utils
 */
function hasBody(req: e.Request): boolean {
  const encoding = 'transfer-encoding' in req.headers
  const length =
    'content-length' in req.headers && req.headers['content-length'] !== '0'
  return encoding || length
}

/**
 * Get request mime-type without character encoding
 *
 * @see connect.utils
 */
function mime(req: e.Request): string {
  const str = req.headers['content-type'] || ''
  return str.split(';')[0]
}

