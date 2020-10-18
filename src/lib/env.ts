export type EnvKey = 'NODE_ENV' | string

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const env = (key: EnvKey) => ({
  is: (value: string): boolean => process.env[key] === value
})
