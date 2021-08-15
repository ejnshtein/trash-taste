import { FFMPEG_PATH } from '@src/constants'
import path from 'path'
import ffmetadata from 'ffmetadata'

ffmetadata.setFfmpegPath(FFMPEG_PATH)

const getCurrentTTSeason = () => {
  return (
    new Date(Date.now() - new Date(2020, 6, 3).getTime()).getFullYear() -
    1970 +
    1
  )
}

export const addAudioMetadata = async (
  audioFilePath: string,
  title: string
): Promise<void> => {
  return new Promise((resolve, reject) => {
    ffmetadata.write(
      audioFilePath,
      {
        artist: 'TrashTaste Podcast',
        album: `Season ${getCurrentTTSeason()}`,
        label: title
      },
      {
        attachments: [path.join(process.cwd(), 'assets', 'thumb.jpg')]
      },
      (err) => {
        if (err) {
          return reject(err)
        }

        return resolve()
      }
    )
  })
}
