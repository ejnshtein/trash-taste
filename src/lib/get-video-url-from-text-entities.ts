import { CallbackQuery } from 'grammy/types'

export const getVideoUrlFromTextEntities = (
  message: CallbackQuery['message']
): string => {
  const entity = message.entities.find((entity) =>
    ['url', 'text_link'].includes(entity.type)
  )

  if (entity && entity.type === 'text_link') {
    const { url } = entity

    return url
  }

  if (entity && entity.type === 'url') {
    const { offset, length } = entity
    const url = message.text.slice(offset, offset + length)

    return url
  }

  return ''
}
