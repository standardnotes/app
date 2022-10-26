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
}

const Calendar: FunctionComponent<Props> = ({ activities, onDateSelect, activityType }) => {
  const activityMap = useMemo(() => createActivityRecord(activities), [activities])

  const today = new Date()
  const [date, setDate] = useState(today)
  const [day, setDay] = useState(date.getDate())
  const [month, setMonth] = useState(date.getMonth())
  const [year, setYear] = useState(date.getFullYear())
  const [startDay, setStartDay] = useState(getStartDayOfMonth(date))

  useEffect(() => {
    setDay(date.getDate())
    setMonth(date.getMonth())
    setYear(date.getFullYear())
    setStartDay(getStartDayOfMonth(date))
  }, [date])

  const days = isLeapYear(year) ? CalendarDaysLeap : CalendarDays

  return (
    <div className="w-full border-b border-solid border-border pb-2">
      <div className="mr-auto ml-auto w-70">
        <div className="text-md mt-2 flex justify-between py-1 px-1 font-bold">
          <button onClick={() => setDate(new Date(year, month - 1, day))}>
            <Icon type="chevron-left" />
          </button>
          <div>
            {CalendarMonths[month]} {year}
          </div>
          <button onClick={() => setDate(new Date(year, month + 1, day))}>
            <Icon type="chevron-right" />
          </button>
        </div>

        <div className="flex w-full flex-wrap">
          {CalendarDaysOfTheWeek.map((d) => (
            <div className={'flex h-8 w-[14.2%] cursor-pointer items-center justify-center'} key={d}>
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
                  mode={activityType}
                  isToday={dateToDateOnlyString(date) === dateToDateOnlyString(today)}
                  activities={activities}
                  onClick={() => onDateSelect(date)}
                />
              )
            })}
        </div>
      </div>
    </div>
  )
}

export default observer(Calendar)
