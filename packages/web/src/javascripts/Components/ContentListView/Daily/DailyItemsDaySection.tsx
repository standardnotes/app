import { ListableContentItem } from '../Types/ListableContentItem'

export type DailyItemsDaySection = {
  dateKey: string
  day: number
  date: Date
  items?: ListableContentItem[]
  isToday: boolean
  id: string
}

export function areDailySectionsEqual(a: DailyItemsDaySection, b: DailyItemsDaySection): boolean {
  return a.id === b.id && a.dateKey === b.dateKey && a.items?.length === b.items?.length
}
