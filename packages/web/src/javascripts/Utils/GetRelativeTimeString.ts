import '@/Utils/DateLocale'
import dayjs from 'dayjs'

export function getRelativeTimeString(date: Parameters<typeof dayjs>[0]): string {
  return dayjs(date).fromNow()
}
