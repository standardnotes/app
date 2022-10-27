import { useState, useEffect, FunctionComponent, useMemo } from 'react'
import { CalendarActivity } from './CalendarActivity'
import CalendarDay from './CalendarDay'
import { CalendarDays, CalendarDaysLeap, CalendarDaysOfTheWeek } from './Constants'
import { createActivityRecord, dateToDateOnlyString, isLeapYear, getStartDayOfMonth } from './CalendarUtilts'
import { isDateInSameDay } from '@/Utils/DateUtils'

type Props = {
  activities: CalendarActivity[]
  onDateSelect: (date: Date) => void
  startDate: Date
  className?: string
  selectedDay?: Date
}

const Calendar: FunctionComponent<Props> = ({ activities, startDate, onDateSelect, selectedDay, className }) => {
  const activityMap = useMemo(() => createActivityRecord(activities), [activities])

  const [date, setDate] = useState(startDate || new Date())
  const [month, setMonth] = useState(date.getMonth())
  const [year, setYear] = useState(date.getFullYear())
  const [startDay, setStartDay] = useState(getStartDayOfMonth(date))

  useEffect(() => {
    setDate(startDate)
    setMonth(startDate.getMonth())
    setYear(startDate.getFullYear())
    setStartDay(getStartDayOfMonth(startDate))
  }, [startDate])

  const today = new Date()
  const days = isLeapYear(year) ? CalendarDaysLeap : CalendarDays

  return (
    <div className={`w-300 ${className} border-left border-right border border-neutral`}>
      <div className="mr-auto ml-auto w-70">
        <div className="flex w-full flex-wrap">
          {CalendarDaysOfTheWeek.map((d) => (
            <div className={'flex h-8 w-[14.2%] items-center justify-center'} key={d}>
              {d}
            </div>
          ))}
        </div>
        <div className="flex w-full flex-wrap">
          {Array(days[month] + (startDay - 1))
            .fill(null)
            .map((_, index) => {
              const d = index - (startDay - 2)
              const date = new Date(year, month, d)
              const activities = activityMap[dateToDateOnlyString(date)] || []
              return (
                <CalendarDay
                  key={index}
                  day={d}
                  isToday={isDateInSameDay(date, today)}
                  activities={activities}
                  onClick={() => onDateSelect(date)}
                  hasPendingEntry={selectedDay && isDateInSameDay(selectedDay, date)}
                />
              )
            })}
        </div>
      </div>
    </div>
  )
}

export default Calendar
