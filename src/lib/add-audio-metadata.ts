import NodeID3 from 'node-id3'
import path from 'path'

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
    NodeID3.write(
      {
        artist: 'TrashTaste Podcast',
        album: `Season ${getCurrentTTSeason()}`,
        title,
        image: path.join(process.cwd(), 'assets', 'thumb.jpg')
      },
      audioFilePath,
      (err) => {
        if (err) {
          return reject(err)
        }

        return resolve()
      }
    )
  })
}
