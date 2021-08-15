declare module 'ffmetadata' {
  export interface FFMpegMetadata {
    artist?: string
    album?: string
    track?: string
    disc?: string
    label?: string
    date?: string
  }

  export interface FFMetadataWriteOptions {
    attachments?: string[]
    id3v1?: boolean
    'id3v2.3'?: boolean
    dryRun?: boolean
  }

  export interface FFMetadataReadOptions {
    dryRun?: boolean
    coverPath?: string
  }

  export function setFfmpegPath(path: string): void

  export function read(src: string, callback: (err?: Error, data: FFMpegMetadata) => void): void
  export function read(src: string, options: FFMetadataReadOptions, callback: (err?: Error, data: FFMpegMetadata) => void): void

  export function write(src: string, data: FFMpegMetadata, callback: (err?: Error) => void): void
  export function write(src: string, data: FFMpegMetadata, options: FFMetadataWriteOptions, callback: (err?: Error) => void): void
}
