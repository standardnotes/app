import { FunctionComponent } from 'react'
import { CalendarActivity } from './CalendarActivity'

type Props = {
  day: number
  activities: CalendarActivity[]
  isToday: boolean
  onClick: () => void
  hasPendingEntry?: boolean
}

const CalendarDay: FunctionComponent<Props> = ({ day, activities = [], hasPendingEntry, isToday, onClick }) => {
  const hasActivity = day > 0 && activities.length > 0
  const todayClassNames = 'bg-danger text-danger-contrast font-bold'
  const hasActivityClassNames = 'bg-danger-light text-danger font-bold'
  const defaultClassNames = 'bg-transparent hover:bg-contrast'
  const hasPendingEntryNames = 'bg-contrast'

  return (
    <div className="h-7 w-[14.2%] p-0.5">
      <div
        className={`${
          !hasActivity && !isToday ? defaultClassNames : ''
        } flex h-full w-full cursor-pointer items-center justify-center rounded ${
          isToday ? todayClassNames : hasActivity ? hasActivityClassNames : ''
        } ${hasPendingEntry ? hasPendingEntryNames : ''}`}
        key={day}
        onClick={onClick}
      >
        {day > 0 ? day : ''}
      </div>
    </div>
  )
}

export default CalendarDay
