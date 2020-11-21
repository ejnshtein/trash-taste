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
    console.log('Encoding video')
    ffmpeg()
      .addInput(video)
      .addInput(audio)
      .addOptions(['-c:v copy', '-c:a aac', '-map 0:v:0', '-map 1:a:0'])
      .once('end', resolve)
      .once('error', reject)
      .output(result)
      .run()
  })
}
