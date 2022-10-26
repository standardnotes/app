import { ListableContentItem } from '../Types/ListableContentItem'

export type DailyItemsDaySection = {
  dateKey: string
  day: number
  date: Date
  items?: ListableContentItem[]
  isToday: boolean
}
