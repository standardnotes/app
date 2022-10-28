import { areDatesInSameMonth } from '@/Utils/DateUtils'
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import Calendar from './Calendar'
import { CalendarActivity, CalendarActivityType } from './CalendarActivity'
import { CalendarMonth } from './CalendarMonth'
import { CalendarMonths } from './Constants'
import { insertMonths, insertMonthsWithTarget } from './CalendarUtilts'

type Props = {
  activityType: CalendarActivityType
  activities: CalendarActivity[]
  onDateSelect: (date: Date) => void
  selectedTemplateDay?: Date
  selectedItemDay?: Date
}

export type InfiniteCalendarInterface = {
  changeMonth: (month: Date) => void
}

const PageSize = 10

const InfiniteCalendar = forwardRef<InfiniteCalendarInterface, Props>(
  ({ activities, onDateSelect, selectedTemplateDay, selectedItemDay }: Props, ref) => {
    const [date, setDate] = useState(new Date())
    const [month, setMonth] = useState(date.getMonth())
    const [year, setYear] = useState(date.getFullYear())

    const [expanded, setExpanded] = useState(true)
    const [scrollWidth, setScrollWidth] = useState(0)

    const today = new Date()
    const [months, setMonths] = useState<CalendarMonth[]>(() => {
      const base = [{ date: today }]
      insertMonths(base, 'front', 2)
      insertMonths(base, 'end', 2)
      return base
    })

    useImperativeHandle(ref, () => ({
      changeMonth(date: Date) {
        setDate(date)
      },
    }))

    const [firstElement, setFirstElement] = useState<HTMLDivElement | null>(null)
    const [lastElement, setLastElement] = useState<HTMLDivElement | null>(null)
    const [didPaginateLeft, setDidPaginateLeft] = useState(false)
    const [restoreScrollAfterExpand, setRestoreScrollAfterExpand] = useState(false)
    const scrollArea = useRef<HTMLDivElement>(null)

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
      [months, setMonths],
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
      if (selectedTemplateDay) {
        setDate(selectedTemplateDay)
      }
    }, [selectedTemplateDay])

    useEffect(() => {
      if (selectedItemDay) {
        setDate(selectedItemDay)
      }
    }, [selectedItemDay])

    const scrollToMonth = useCallback((date: Date) => {
      const elementId = elementIdForMonth(date)
      const element = document.getElementById(elementId)
      if (!element) {
        return
      }

      scrollArea.current!.scrollLeft = element.offsetLeft + -60
    }, [])

    useLayoutEffect(() => {
      setMonth(date.getMonth())
      setYear(date.getFullYear())

      if (!hasMonthInList(date)) {
        insertMonthInList(date)
      }

      scrollToMonth(date)
    }, [date, hasMonthInList, insertMonthInList, scrollToMonth])

    useEffect(() => {
      if (!restoreScrollAfterExpand) {
        return
      }

      if (scrollArea.current && expanded) {
        scrollToMonth(date)
        setRestoreScrollAfterExpand(false)
      }
    }, [expanded, scrollToMonth, date, restoreScrollAfterExpand, setRestoreScrollAfterExpand])

    useLayoutEffect(() => {
      if (!scrollArea.current) {
        return
      }

      if (didPaginateLeft) {
        scrollArea.current.scrollLeft += scrollArea.current.scrollWidth - scrollWidth
        setDidPaginateLeft(false)
      }
    }, [months, didPaginateLeft, scrollWidth])

    const paginateLeft = useCallback(() => {
      if (scrollArea.current) {
        setScrollWidth(scrollArea.current.scrollWidth)
      }

      const copy = months.slice()
      insertMonths(copy, 'front', PageSize)
      setDidPaginateLeft(true)
      setMonths(copy)
    }, [months, setMonths])

    const paginateRight = useCallback(() => {
      const copy = months.slice()
      insertMonths(copy, 'end', PageSize)
      setDidPaginateLeft(false)
      setMonths(copy)
    }, [months, setMonths])

    const updateCurrentMonth = useCallback(
      (index: number) => {
        const newMonth = months[index]
        setMonth(newMonth.date.getMonth())
        setYear(newMonth.date.getFullYear())
      },
      [months, setMonth, setYear],
    )

    const visibilityObserver = useMemo(
      () =>
        new IntersectionObserver(
          (entries) => {
            const visibleEntry = entries.find((entry) => entry.isIntersecting)
            if (visibleEntry) {
              const id = visibleEntry.target.id
              const index = months.findIndex((candidate) => elementIdForMonth(candidate.date) === id)
              updateCurrentMonth(index)
            }
          },
          { threshold: 0.9 },
        ),
      [updateCurrentMonth, months],
    )

    const rightObserver = useMemo(
      () =>
        new IntersectionObserver(
          (entries) => {
            if (entries[0].isIntersecting) {
              paginateRight()
            }
          },
          { threshold: 0.5 },
        ),
      [paginateRight],
    )

    const leftObserver = useMemo(
      () =>
        new IntersectionObserver(
          (entries) => {
            if (entries[0].isIntersecting) {
              paginateLeft()
            }
          },
          { threshold: 1.0 },
        ),
      [paginateLeft],
    )

    useEffect(() => {
      if (lastElement) {
        rightObserver.observe(lastElement)
      }

      return () => {
        if (lastElement) {
          rightObserver.unobserve(lastElement)
        }
      }
    }, [lastElement, rightObserver])

    useEffect(() => {
      if (firstElement) {
        leftObserver.observe(firstElement)
      }

      return () => {
        if (firstElement) {
          leftObserver.unobserve(firstElement)
        }
      }
    }, [firstElement, leftObserver])

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
      <div className="w-full flex-shrink-0 border-b border-solid border-border">
        <div
          className="text-md flex cursor-pointer items-center justify-center py-2 px-4 text-center font-bold hover:bg-contrast"
          onClick={toggleVisibility}
        >
          {CalendarMonths[month]} {year}
        </div>
        {expanded && (
          <div
            style={{ scrollBehavior: 'smooth' }}
            ref={scrollArea}
            id="calendar-scroller"
            className="flex w-full overflow-x-scroll pb-2 md:max-w-full"
          >
            {months.map((month, index) => {
              const isFirst = index === 0
              const isLast = index === months.length - 1
              const id = elementIdForMonth(month.date)
              return (
                <div
                  id={id}
                  key={id}
                  ref={(ref) => {
                    isFirst ? setFirstElement(ref) : isLast ? setLastElement(ref) : null

                    if (ref) {
                      visibilityObserver.observe(ref)
                    }
                  }}
                >
                  <Calendar
                    key={id}
                    className="mx-2"
                    activities={activities}
                    onDateSelect={handleDaySelection}
                    startDate={month.date}
                    selectedDay={selectedTemplateDay}
                  />
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  },
)

export default InfiniteCalendar
