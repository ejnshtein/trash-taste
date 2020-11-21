import ffmpeg from 'fluent-ffmpeg'

export interface MergeStreamsArguments {
  video: string
  audio: string
  result: string
}

export const mergeStreams = async ({
  video,
  audio,
  result
}: MergeStreamsArguments): Promise<void> => {
  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(video)
      .inputFormat('mp4')
      .input(audio)
      .inputFormat('mp3')
      .once('end', () => {
        resolve()
      })
      .once('error', reject)
      .mergeToFile(result)
  })
}
