import { classNames } from '@/Utils/ConcatenateClassNames'
import { FunctionComponent, useCallback, useState } from 'react'
import { CalendarActivity, CalendarActivityType } from './CalendarActivity'

type Props = {
  day: number
  mode: CalendarActivityType
  activities: CalendarActivity[]
  isToday: boolean
  onClick: () => void
  hasPendingEntry?: boolean
}

const CalendarDay: FunctionComponent<Props> = ({ day, activities = [], hasPendingEntry, isToday, onClick, mode }) => {
  const [showTooltip, setShowTooltip] = useState(false)

  const onHoverEnter = useCallback(() => {
    if (activities.length > 0) {
      setShowTooltip(true)
    }
  }, [activities])

  const onHoverExit = useCallback(() => {
    setShowTooltip(false)
  }, [])

  activities.map((activity) => {
    return <div>{activity.item.title}</div>
  })

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
        onMouseEnter={onHoverEnter}
        onMouseLeave={onHoverExit}
        key={day}
        onClick={onClick}
      >
        {day > 0 ? day : ''}
      </div>

      {showTooltip && (
        <div className="relative z-tooltip">
          <div
            className={classNames(
              'absolute top-full left-0 z-tooltip min-w-[90vw] translate-x-2 translate-y-1 select-none rounded',
              'border border-border bg-default py-1.5 px-3 text-left peer-hover:block peer-focus:block md:min-w-max',
            )}
          >
            <div className="font-bold">{mode === 'created' ? 'Items created' : 'Items edited'}</div>
            <ul className="ml-3 list-disc">
              {activities.map((activity) => {
                return (
                  <li key={activity.item.uuid}>
                    <>{activity.item.title && activity.item.title}</>
                    <>{!activity.item.title && <div className="italic">No title</div>}</>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}

export default CalendarDay
