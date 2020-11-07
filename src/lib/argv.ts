export const argv = (name: string): boolean => process.argv.includes(name)
export const getArgv = (name: string): string => {
  const id = process.argv.indexOf(name)
  if (id !== -1) {
    return process.argv[id + 1]
  }
  return undefined
}
