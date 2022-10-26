import { ListableContentItem } from '../Types/ListableContentItem'

export type DailyItemsDaySection = {
  dateKey: string
  day: number
  weekday: string
  date: Date
  items?: ListableContentItem[]
  isToday: boolean
  id: string
}
