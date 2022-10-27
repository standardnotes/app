import { observer } from 'mobx-react-lite'
import { useState, useEffect, FunctionComponent, useMemo } from 'react'
import Icon from '../../Icon/Icon'
import { CalendarActivityType, CalendarActivity } from './CalendarActivity'
import CalendarDay from './CalendarDay'
import { CalendarDays, CalendarDaysLeap, CalendarDaysOfTheWeek, CalendarMonths } from './Constants'
import { createActivityRecord, dateToDateOnlyString, isLeapYear, getStartDayOfMonth } from './Utilts'

type Props = {
  activityType: CalendarActivityType
  activities: CalendarActivity[]
  onDateSelect: (date: Date) => void
  startDate: Date
  className?: string
}

const Calendar: FunctionComponent<Props> = ({ activities, startDate, onDateSelect, activityType, className }) => {
  const activityMap = useMemo(() => createActivityRecord(activities), [activities])

  const [date, setDate] = useState(startDate || new Date())
  const [day, setDay] = useState(date.getDate())
  const [month, setMonth] = useState(date.getMonth())
  const [year, setYear] = useState(date.getFullYear())
  const [startDay, setStartDay] = useState(getStartDayOfMonth(date))
  const [expanded, setExpanded] = useState(true)

  useEffect(() => {
    setDate(startDate)
    setDay(startDate.getDate())
    setMonth(startDate.getMonth())
    setYear(startDate.getFullYear())
    setStartDay(getStartDayOfMonth(startDate))
  }, [startDate])

  const today = new Date()
  const days = isLeapYear(year) ? CalendarDaysLeap : CalendarDays

  const MonthPicker = () => {
    return (
      <div className="text-md mt-2 flex justify-between py-1 px-1 font-bold">
        <button className="hover:bg-contrast" onClick={() => setDate(new Date(year, month - 1, day))}>
          <Icon type="chevron-left" />
        </button>
        <div className="cursor-pointer px-4 py-0.5 hover:bg-contrast" onClick={() => setExpanded(!expanded)}>
          {CalendarMonths[month]} {year}
        </div>
        <button className="hover:bg-contrast" onClick={() => setDate(new Date(year, month + 1, day))}>
          <Icon type="chevron-right" />
        </button>
      </div>
    )
  }

  const WeekDayRow = () => {
    return (
      <div className="flex w-full flex-wrap">
        {CalendarDaysOfTheWeek.map((d) => (
          <div className={'flex h-8 w-[14.2%] items-center justify-center'} key={d}>
            {d}
          </div>
        ))}
      </div>
    )
  }

  const DayGrid = () => {
    return (
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
                mode={activityType}
                isToday={dateToDateOnlyString(date) === dateToDateOnlyString(today)}
                activities={activities}
                onClick={() => onDateSelect(date)}
              />
            )
          })}
      </div>
    )
  }

  return (
    <div className={`w-300 border-b border-solid border-border pb-2 ${className}`}>
      <div className="mr-auto ml-auto w-70">
        {expanded && (
          <>
            <WeekDayRow />
            <DayGrid />
          </>
        )}
      </div>
    </div>
  )
}

export default observer(Calendar)
