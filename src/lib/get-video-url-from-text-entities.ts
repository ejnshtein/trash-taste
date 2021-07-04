import { MessageContentUnion } from 'airgram'

export const getVideoUrlFromTextEntities = (
  msg: MessageContentUnion
): string => {
  if (msg._ === 'messageText') {
    const { type } = msg.text.entities.find(
      (entity) =>
        entity._ === 'textEntity' &&
        ['textEntityTypeTextUrl', 'textEntityTypeUrl'].includes(entity.type._)
    )

    if (type._ === 'textEntityTypeTextUrl') {
      const { url } = type

      return url
    }

    return ''
  }

  return ''
}
