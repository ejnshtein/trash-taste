import { env } from '@src/lib/env'
import { botClient } from '@src/tg-api'
import {
  attach,
  createEffect,
  createEvent,
  createStore,
  sample
} from 'effector'
import { GrammyError, HttpError } from 'grammy'

export const log = createEvent<string>()

log.watch((message) => {
  console.log(message)
})

export const notifyAdminFx = createEffect(
  ({
    text,
    chatId,
    replyToMessageId
  }: {
    text: string
    chatId: number
    replyToMessageId?: number
  }) =>
    botClient.api.sendMessage(
      chatId,
      text,
      replyToMessageId
        ? {
            reply_parameters: {
              message_id: replyToMessageId
            }
          }
        : {}
    )
)

notifyAdminFx.watch(({ text }) => {
  console.log(`Admin notification: ${text}`)
})

export const answerCallbackQueryFx = createEffect(
  ({ callbackQueryId, text }: { callbackQueryId: string; text: string }) =>
    botClient.api.answerCallbackQuery(callbackQueryId, { text })
)

export const updateMessageFactory = () => {
  const setUpdateMessage = createEvent<{
    chatId: number
    messageId: number
  }>()
  const $updateMessage = createStore<{
    chatId: number
    messageId: number
  } | null>(null).on(setUpdateMessage, (_, { chatId, messageId }) => ({
    chatId,
    messageId
  }))

  const updateMessageFx = createEffect<
    {
      chatId: number
      messageId: number
      text: string
    },
    ReturnType<typeof botClient.api.editMessageText>,
    GrammyError | HttpError
  >(({ chatId, messageId, text }) =>
    botClient.api.editMessageText(chatId, messageId, text)
  )

  const updateMessage = attach({
    effect: updateMessageFx,
    source: $updateMessage,
    mapParams: (text: string, { chatId, messageId }) => ({
      chatId,
      messageId,
      text
    })
  })

  sample({
    clock: updateMessageFx.failData,
    filter: (error) => error instanceof HttpError,
    fn: ({ message }) => message,
    target: notifyAdminFx.prepend((message) => ({
      chatId: env.ADMIN_ID,
      text: `Error during updating message: ${message}`
    }))
  })

  return { setUpdateMessage, $updateMessage, updateMessage }
}
