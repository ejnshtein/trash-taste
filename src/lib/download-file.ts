import EasyDl from 'easydl'

export const downloadFile = async (url: string, filePath: string) => {
  const dl = new EasyDl(url, filePath, {
    connections: 40,
    maxRetry: 5,
    existBehavior: 'ignore'
  })

  return await dl.wait()
}
