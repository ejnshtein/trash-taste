import path from 'path'
import fs from 'fs'
import { Composer } from 'grammy'
import { env } from '@src/lib/env'
import { botClient } from '@src/tg-api'
import { onlySuperAdmin } from 'grammy-middlewares'

const tmpDir = path.join(__dirname, '..', '..', '.tmp')

const composer = new Composer()

composer.use(onlySuperAdmin(env.ADMIN_ID)).command('cleanup', async (ctx) => {
  try {
    await cleanupTMPDir()
  } catch (e) {
    await ctx.reply(`Error: ${e.message}`)
    return
  }
  await ctx.reply(`Cleaned!`)
})

export const cleanupTMPDir = async () => {
  const files = await fs.promises.readdir(tmpDir, {
    encoding: 'utf-8',
    withFileTypes: true
  })

  for (const file of files) {
    if (file.isFile() && file.name !== '.gitkeep') {
      await fs.promises.rm(path.join(tmpDir, file.name))
    }
  }
}

botClient.use(composer.middleware())
