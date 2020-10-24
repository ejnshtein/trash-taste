import * as ffmpeg from 'ffmpeg-cli'

export const extractAudio = async (
  audioFilePath: string,
  filePath: string
): Promise<void> => {
  await ffmpeg.run(`-i ${filePath} ${audioFilePath}`)
}
