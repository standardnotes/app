import { ListableContentItem } from '../Types/ListableContentItem'

export type DailyItemsDay = {
  dateKey: string
  day: number
  weekday: string
  date: Date
  items?: ListableContentItem[]
  isToday: boolean
  id: string
}
