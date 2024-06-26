import { FFMPEG_PATH } from '@src/constants'
import path from 'path'
import ffmetadata from 'ffmetadata'

ffmetadata.setFfmpegPath(FFMPEG_PATH)

const getCurrentTTSeason = () => {
  // return (
  //   new Date(Date.now() - new Date(2020, 6, 3).getTime()).getFullYear() -
  //   1970 +
  //   1
  // )

  /**
   * #100 ep is out nominating end of season 2
   * season 3 is from now on https://youtu.be/jtKsu1aIwvM
   */
  // return 3
  /**
   * #150 ep is out nominating end of season 3
   * season 3 is from now on https://youtu.be/tseYLDWzTCc
   */
  // return 4
  /**
   * #204 ep is out nominating end of season 4
   * season 5 is from now on https://youtu.be/2hsRkCWTrAg
   */
  return 5
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
