import { areDatesInSameMonth } from '@/Utils/DateUtils'
import { observer } from 'mobx-react-lite'
import { FunctionComponent, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { dailiesDateToSectionTitle } from '../Daily/Utils'
import Calendar from './Calendar'
import { CalendarActivity, CalendarActivityType } from './CalendarActivity'
import { CalendarMonth } from './CalendarMonth'
import { CalendarMonths } from './Constants'
import { insertMonths } from './Utilts'

type Props = {
  activityType: CalendarActivityType
  activities: CalendarActivity[]
  onDateSelect: (date: Date) => void
}

const PageSize = 20

const CalendarScroller: FunctionComponent<Props> = ({ activities, onDateSelect, activityType }) => {
  const [date] = useState(new Date())
  const [month, setMonth] = useState(date.getMonth())
  const [year, setYear] = useState(date.getFullYear())
  const [expanded, setExpanded] = useState(true)
  const [didInitialScroll, setDidInitialScroll] = useState(false)
  const today = new Date()

  const [scrollWidth, setScrollWidth] = useState(0)
  const [lastScrollLeft, setLastScrollLeft] = useState(0)

  const [months, setMonths] = useState<CalendarMonth[]>(() => {
    const base = [{ date: today }]
    insertMonths(base, 'front', 2)
    insertMonths(base, 'end', 2)
    return base
  })

  const [firstElement, setFirstElement] = useState<HTMLDivElement | null>(null)
  const [lastElement, setLastElement] = useState<HTMLDivElement | null>(null)
  const [todayMonthElement, setTodayMonthElement] = useState<HTMLDivElement | null>(null)
  const [didPaginateLeft, setDidPaginateLeft] = useState(false)
  const [restoreScrollAfterExpand, setRestoreScrollAfterExpand] = useState(false)
  const scrollview = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (didInitialScroll) {
      return
    }

    if (todayMonthElement) {
      todayMonthElement.scrollIntoView({
        behavior: 'auto',
        block: 'center',
        inline: 'center',
      })
      setDidInitialScroll(true)
    }
  }, [todayMonthElement, didInitialScroll, setDidInitialScroll])

  useEffect(() => {
    if (!restoreScrollAfterExpand) {
      return
    }

    if (scrollview.current && expanded) {
      scrollview.current.scrollLeft = lastScrollLeft
      setRestoreScrollAfterExpand(false)
    }
  }, [lastScrollLeft, expanded, restoreScrollAfterExpand, setRestoreScrollAfterExpand])

  useLayoutEffect(() => {
    if (!scrollview.current) {
      return
    }

    if (didPaginateLeft) {
      scrollview.current.scrollLeft += scrollview.current.scrollWidth - scrollWidth
    }
  }, [months, didPaginateLeft, scrollWidth])

  const paginateLeft = useCallback(() => {
    if (scrollview.current) {
      setScrollWidth(scrollview.current.scrollWidth)
    }

    const copy = months.slice()
    insertMonths(copy, 'front', PageSize)
    setDidPaginateLeft(true)
    setMonths(copy)
  }, [months, setMonths])

  const paginateRight = useCallback(() => {
    if (scrollview.current) {
      setScrollWidth(scrollview.current.scrollWidth)
    }

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
            const index = Number(id.split('-')[1])
            updateCurrentMonth(index)
          }
        },
        { threshold: 0.9 },
      ),
    [updateCurrentMonth],
  )

  const rightObserver = useMemo(
    () =>
      new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          paginateRight()
        }
      }),
    [paginateRight],
  )

  const leftObserver = useMemo(
    () =>
      new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          paginateLeft()
        }
      }),
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
    if (scrollview.current && expanded) {
      setRestoreScrollAfterExpand(true)
      setScrollWidth(scrollview.current.scrollWidth)
      setLastScrollLeft(scrollview.current.scrollLeft)
    }

    setExpanded(!expanded)
  }, [expanded, setExpanded, setScrollWidth, scrollview, setRestoreScrollAfterExpand, setLastScrollLeft])

  const MonthLabel = () => {
    return (
      <div
        className="text-md flex cursor-pointer items-center justify-center py-2 px-4 text-center font-bold hover:bg-contrast"
        onClick={toggleVisibility}
      >
        {CalendarMonths[month]} {year}
      </div>
    )
  }

  return (
    <div className="w-full flex-shrink-0 border-b border-solid border-border">
      <MonthLabel />
      {expanded && (
        <div ref={scrollview} id="calendar-scroller" className="flex w-full overflow-x-scroll pb-2 md:max-w-full">
          {months.map((month, index) => {
            const isFirst = index === 0
            const isLast = index === months.length - 1
            const isCurrent = areDatesInSameMonth(today, month.date)
            const id = `month-${index}-${dailiesDateToSectionTitle(month.date)}`
            return (
              <div
                id={id}
                key={id}
                ref={(ref) => {
                  isCurrent
                    ? setTodayMonthElement(ref)
                    : isFirst
                    ? setFirstElement(ref)
                    : isLast
                    ? setLastElement(ref)
                    : null

                  if (ref) {
                    visibilityObserver.observe(ref)
                  }
                }}
              >
                <Calendar
                  className="mx-2"
                  activities={activities}
                  onDateSelect={onDateSelect}
                  activityType={activityType}
                  startDate={month.date}
                />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default observer(CalendarScroller)
