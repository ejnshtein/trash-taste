import EasyDl from 'easydl'

export const downloadFile = async (
  url: string,
  filePath: string
): Promise<void> => {
  await new EasyDl(url, filePath, {
    connections: 5,
    maxRetry: 5,
    existBehavior: 'overwrite'
  }).wait()
}
