import { areDatesInSameDay, areDatesInSameMonth } from '@/Utils/DateUtils'
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import Calendar from './Calendar'
import { CalendarActivity, CalendarActivityType } from './CalendarActivity'
import { CalendarMonth } from './CalendarMonth'
import { CalendarMonths } from './Constants'
import { insertMonths, insertMonthsWithTarget } from './CalendarUtilts'
import { InfiniteScrollerInterface, InfinteScroller } from '../InfiniteScroller/InfiniteScroller'
import { classNames } from '@standardnotes/utils'
import { LoggingDomain, log } from '@/Logging'
import { usePrevious } from './usePrevious'
import { isMobileScreen } from '@/Utils'

type Props = {
  activityType: CalendarActivityType
  activities: CalendarActivity[]
  onDateSelect: (date: Date) => void
  selectedDay?: Date
  selectedDayType?: 'item' | 'template'
  className?: string
  children?: React.ReactNode
}

export type InfiniteCalendarInterface = {
  goToMonth: (month: Date) => void
}

const PageSize = 2

const InfiniteCalendar = forwardRef<InfiniteCalendarInterface, Props>(
  ({ activities, onDateSelect, selectedDay, className, children }: Props, ref) => {
    const [expanded, setExpanded] = useState(isMobileScreen() ? false : true)
    const [restoreScrollAfterExpand, setRestoreScrollAfterExpand] = useState(false)
    const scrollerRef = useRef<InfiniteScrollerInterface | null>(null)
    const previousSelectedDay = usePrevious(selectedDay)

    const [activeDate, setActiveDate] = useState(new Date())
    const today = new Date()
    const [months, setMonths] = useState<CalendarMonth[]>(() => {
      const base = [{ date: today }]
      insertMonths(base, 'front', 2)
      insertMonths(base, 'end', 2)
      return base
    })

    const hasMonthInList = useCallback(
      (date: Date): boolean => {
        for (const month of months) {
          if (areDatesInSameMonth(month.date, date)) {
            return true
          }
        }
        return false
      },
      [months],
    )

    const insertMonthInList = useCallback(
      (date: Date): void => {
        setMonths(insertMonthsWithTarget(months, date))
      },
      [months],
    )

    const scrollToMonth = useCallback(
      (date: Date) => {
        const elementId = elementIdForMonth(date)
        scrollerRef.current?.scrollToElementId(elementId)
      },
      [scrollerRef],
    )

    const goToMonth = useCallback(
      (month: Date) => {
        if (!hasMonthInList(month)) {
          insertMonthInList(month)
        }

        log(LoggingDomain.DailyNotes, '[Calendar] Scrolling to month', month, 'from goToMonth')
        setActiveDate(month)
        scrollToMonth(month)
      },
      [hasMonthInList, insertMonthInList, scrollToMonth],
    )

    useImperativeHandle(
      ref,
      () => ({
        goToMonth(date: Date) {
          goToMonth(date)
        },
      }),
      [goToMonth],
    )

    const resetNumberOfCalendarsToBase = useCallback(
      (centerOnDate: Date) => {
        const base = [{ date: centerOnDate }]
        insertMonths(base, 'front', 1)
        insertMonths(base, 'end', 1)
        setMonths(base)
      },
      [setMonths],
    )

    useEffect(() => {
      if (selectedDay) {
        if (previousSelectedDay && areDatesInSameDay(previousSelectedDay, selectedDay)) {
          log(LoggingDomain.DailyNotes, '[Calendar] selectedDay has changed, but is same as previous', selectedDay)
          return
        }
        log(LoggingDomain.DailyNotes, '[Calendar] selectedDay has changed, going to month:', selectedDay)
        goToMonth(selectedDay)
      }
    }, [selectedDay, goToMonth, previousSelectedDay])

    useEffect(() => {
      if (!restoreScrollAfterExpand) {
        return
      }

      if (expanded) {
        log(
          LoggingDomain.DailyNotes,
          '[Calendar] Scrolling to month',
          activeDate,
          'from restoreScrollAfterExpand useEffect',
        )
        scrollToMonth(activeDate)
        setRestoreScrollAfterExpand(false)
      }
    }, [expanded, scrollToMonth, activeDate, restoreScrollAfterExpand, setRestoreScrollAfterExpand])

    const paginateLeft = useCallback(() => {
      log(LoggingDomain.DailyNotes, '[Calendar] paginateLeft')
      setMonths((prevMonths) => {
        const copy = prevMonths.slice()
        insertMonths(copy, 'front', PageSize)
        return copy
      })
    }, [setMonths])

    const paginateRight = useCallback(() => {
      log(LoggingDomain.DailyNotes, '[Calendar] paginateRight')
      setMonths((prevMonths) => {
        const copy = prevMonths.slice()
        insertMonths(copy, 'end', PageSize)
        return copy
      })
    }, [setMonths])

    const onElementVisibility = useCallback(
      (id: string) => {
        const index = months.findIndex((candidate) => elementIdForMonth(candidate.date) === id)
        if (index >= 0) {
          const newMonth = months[index]
          log(LoggingDomain.DailyNotes, '[Calendar] Month element did become visible, setting activeDate', newMonth)
          setActiveDate(newMonth.date)
        }
      },
      [months],
    )

    const toggleVisibility = useCallback(() => {
      setRestoreScrollAfterExpand(true)

      setExpanded(!expanded)
    }, [expanded, setExpanded, setRestoreScrollAfterExpand])

    const elementIdForMonth = (date: Date): string => {
      return `month-${date.getFullYear()}-${date.getMonth()}`
    }

    const handleDaySelection = useCallback(
      (date: Date) => {
        resetNumberOfCalendarsToBase(date)
        onDateSelect(date)
      },
      [onDateSelect, resetNumberOfCalendarsToBase],
    )

    return (
      <div className={'border-b border-solid border-border'}>
        <div
          onClick={toggleVisibility}
          className={classNames(
            'text-md flex cursor-pointer items-center justify-center px-4 py-2',
            'text-center font-bold hover:bg-contrast',
          )}
        >
          {CalendarMonths[activeDate.getMonth()]} {activeDate.getFullYear()}
        </div>
        {expanded && (
          <InfinteScroller
            paginateFront={paginateLeft}
            paginateEnd={paginateRight}
            direction={'horizontal'}
            onElementVisibility={onElementVisibility}
            ref={scrollerRef}
            className={className}
            isMobileScreen={isMobileScreen()}
          >
            {months.map((month) => {
              const id = elementIdForMonth(month.date)
              return (
                <div id={id} key={id}>
                  <Calendar
                    key={id}
                    className="mx-2"
                    activities={activities}
                    onDateSelect={handleDaySelection}
                    startDate={month.date}
                    selectedDay={selectedDay}
                  />
                </div>
              )
            })}
          </InfinteScroller>
        )}
        {expanded && children}
      </div>
    )
  },
)

export default InfiniteCalendar
