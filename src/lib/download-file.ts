import fs from 'fs'
import { request } from 'smol-request'

export const downloadFile = async (
  url: string,
  filePath: string
): Promise<void> => {
  const writeStream = fs.createWriteStream(filePath)

  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async (resolve, reject) => {
    const { data: stream } = await request(url, { responseType: 'stream' })
    stream.pipe(writeStream)
    stream.once('error', reject)
    stream.once('end', resolve)
  })
}
