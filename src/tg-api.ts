import { Bot } from 'grammy'
import { env } from './lib/env'

const buildUrlWithLogger = (
  root: string,
  token: string,
  method: string,
  env: "prod" | "test",
) => {
  console.log({ root, token, method, env });
  const prefix = env === "test" ? "test/" : "";
  return `${root}/bot${token}/${prefix}${method}`;
};

export const botClient = new Bot(env.TOKEN, {
  client: {
    apiRoot: env.TELEGRAM_BOT_API,
    buildUrl: buildUrlWithLogger
  }
})

if (env.NODE_ENV !== 'production') {
  botClient.use(async (ctx, next) => {
    const startTime = Date.now()
    await next()
    const endTime = Date.now()
    console.log(
      `update ${ctx.update.update_id} processed in ${endTime - startTime} ms`
    )
  })
}

botClient.catch((err) => {
  console.error('Error:', err)
})
