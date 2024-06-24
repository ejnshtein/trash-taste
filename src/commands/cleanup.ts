import path from 'path'
import fs from 'fs'
import { Composer } from 'grammy'
import { env } from '@src/lib/env'
import { botClient } from '@src/tg-api'

const tmpDir = path.join(__dirname, '..', '..', '.tmp')

const composer = new Composer()

const filteredUpdates = composer.filter(
  (ctx) => ctx.message?.chat?.id === env.ADMIN_ID
)

export const cleanupTMPDir = async () => {
  const files = await fs.promises.readdir(tmpDir, {
    encoding: 'utf-8',
    withFileTypes: true
  })

  for (const file of files) {
    if (file.isFile()) {
      await fs.promises.rm(path.join(tmpDir, file.name))
    }
  }
}

filteredUpdates.command('cleanup', async (ctx) => {
  try {
    await cleanupTMPDir()
  } catch (e) {
    await ctx.reply(`Error: ${e.message}`)
    return
  }
  await ctx.reply(`Cleaned!`)
})

botClient.use(composer.middleware())
