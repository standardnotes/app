import { pluralize } from '@standardnotes/utils'
import { c } from 'ttag'

export const calculateReadTime = (words: number) => {
  const timeToRead = Math.round(words / 200)
  if (timeToRead === 0) {
    return c('B4.Notes.EditorOptions.Label').t`< 1 minute`
  } else {
    const count = timeToRead
    return pluralize(
      timeToRead,
      c('B4.Notes.EditorOptions.Label').jt`${count} minute` as unknown as string,
      c('B4.Notes.EditorOptions.Label').jt`${count} minutes` as unknown as string,
    )
  }
}
