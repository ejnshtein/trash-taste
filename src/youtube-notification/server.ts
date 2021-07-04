/* eslint-disable prettier/prettier */
import { YouTubeNotifier } from './index'
import * as e from 'express'
export const app = e.default()

export function server(notifier: YouTubeNotifier): e.Express {
  app.use(notifier.path, notifier.listener())

  return app
}
