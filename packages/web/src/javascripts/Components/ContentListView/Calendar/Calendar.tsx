import { useState, useEffect, FunctionComponent, useMemo } from 'react'
import { CalendarActivity } from './CalendarActivity'
import CalendarDay from './CalendarDay'
import { CalendarDays, CalendarDaysLeap, CalendarDaysOfTheWeek } from './Constants'
import { createActivityRecord, dateToDateOnlyString, isLeapYear, getStartDayOfMonth } from './CalendarUtilts'
import { areDatesInSameDay } from '@/Utils/DateUtils'

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
  const dayBundle = isLeapYear(year) ? CalendarDaysLeap : CalendarDays
  const days = Array(dayBundle[month] + (startDay - 1)).fill(null)

  return (
    <div className={`w-300 ${className} min-h-[210px]`}>
      <div className="ml-auto mr-auto w-70">
        <div className="flex w-full flex-wrap">
          {CalendarDaysOfTheWeek.map((d) => (
            <div className={'flex h-8 w-[14.2%] items-center justify-center'} key={d}>
              {d}
            </div>
          ))}
        </div>
        <div className="flex w-full flex-wrap">
          {days.map((_, index) => {
            const dayIndex = index - (startDay - 2)
            const date = new Date(year, month, dayIndex)
            const day = date.getDate()
            const activities = activityMap[dateToDateOnlyString(date)] || []
            const isTemplate = selectedDay && areDatesInSameDay(selectedDay, date)
            const type = activities.length > 0 ? 'item' : isTemplate ? 'template' : 'empty'
            return (
              <CalendarDay
                isLastMonth={dayIndex <= 0}
                key={index}
                day={day}
                isToday={areDatesInSameDay(date, today)}
                onClick={() => onDateSelect(date)}
                type={type}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default Calendar
