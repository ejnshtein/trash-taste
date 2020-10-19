import * as ytdl from 'ytdl-core'
import { downloadFile } from './download-video'
import { sendVideo } from './tg-api'

export const processVideo = async (videoId: string): Promise<void> => {
  const info = await ytdl.getInfo(`http://www.youtube.com/watch?v=${videoId}`)

  const video = info.formats.find(
    (format) => format.container === 'mp4' && format.hasAudio && format.hasVideo
  )

  const videoFilePath = await downloadFile(info, video)

  // console.log(videoFilePath, 'downloaded!')

  await sendVideo({
    duration: parseInt(video.approxDurationMs),
    path: videoFilePath,
    width: video.width,
    height: video.height,
    caption: `${info.title}\n\nyoutu.be/${videoId}`
  })
}
