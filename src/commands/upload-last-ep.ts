import { checkVideos } from '@src/check-videos'

export async function uploadLastEpisode(): Promise<void> {
  return checkVideos({ uploadLastEp: true })
}
