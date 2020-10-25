import ffmpeg from 'fluent-ffmpeg'

export const extractAudio = async (
  audioFilePath: string,
  filePath: string
): Promise<void> => {
  return new Promise((resolve, reject) => {
    ffmpeg(filePath)
      .once('end', () => {
        resolve()
      })
      .once('error', reject)
      .saveToFile(audioFilePath)
  })
}
