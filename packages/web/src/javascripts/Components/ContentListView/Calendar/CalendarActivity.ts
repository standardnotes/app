import { ListableContentItem } from '@/Components/ContentListView/Types/ListableContentItem'
export type CalendarActivityType = 'created' | 'edited'

export type CalendarActivity = {
  date: Date
  item: ListableContentItem
}
