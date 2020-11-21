import ffmpeg from 'fluent-ffmpeg'

export const extractAudio = async (
  audioFilePath: string,
  videoFilePath: string
): Promise<void> => {
  return new Promise((resolve, reject) => {
    ffmpeg(videoFilePath)
      .once('end', () => {
        resolve()
      })
      .once('error', reject)
      .saveToFile(audioFilePath)
  })
}
