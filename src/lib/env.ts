import { envsafe, str, num } from 'envsafe'

export const env = envsafe({
  NODE_ENV: str({
    devDefault: 'development',
    choices: ['development', 'production']
  }),
  TOKEN: str(),
  ADMIN_ID: num(),
  YT_CHANNEL_ID: str(),
  TELEGRAM_CHANNEL_ID: num()
})
