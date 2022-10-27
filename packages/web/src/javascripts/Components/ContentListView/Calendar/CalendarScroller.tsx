import { areDatesInSameMonth } from '@/Utils/DateUtils'
import { observer } from 'mobx-react-lite'
import { FunctionComponent, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
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

  const [months, setMonths] = useState<CalendarMonth[]>(() => {
    const base = [{ date: today }]
    insertMonths(base, 'front', 2)
    insertMonths(base, 'end', 2)
    return base
  })

  const [firstElement, setFirstElement] = useState<HTMLDivElement | null>(null)
  const [lastElement, setLastElement] = useState<HTMLDivElement | null>(null)
  const [currentMonthElement, setCurrentMonthElement] = useState<HTMLDivElement | null>(null)
  const [didPaginateLeft, setDidPaginateLeft] = useState(false)
  const scrollview = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (didInitialScroll) {
      return
    }
    if (currentMonthElement) {
      currentMonthElement.scrollIntoView()

      setDidInitialScroll(true)
    }
  }, [currentMonthElement, didInitialScroll, setDidInitialScroll])

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

  useLayoutEffect(() => {
    if (didPaginateLeft && scrollview.current) {
      scrollview.current.scrollLeft += scrollview.current.scrollWidth - scrollWidth
    }
  }, [months, didPaginateLeft])

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
          const firstEntry = entries[0]
          if (firstEntry.isIntersecting) {
            const id = firstEntry.target.id
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

  const MonthLabel = () => {
    return (
      <div
        className=" text-md mt-2 flex cursor-pointer items-center justify-center py-1 px-1 px-4 py-0.5 text-center font-bold hover:bg-contrast"
        onClick={() => setExpanded(!expanded)}
      >
        {CalendarMonths[month]} {year}
      </div>
    )
  }

  return (
    <div className="w-full flex-shrink-0">
      <MonthLabel />
      <div ref={scrollview} id="calendar-scroller" className="flex w-full overflow-x-scroll md:max-w-full">
        {months.map((month, index) => {
          const isFirst = index === 0
          const isLast = index === months.length - 1
          const isCurrent = areDatesInSameMonth(today, month.date)
          return (
            <div
              id={`month-${index}`}
              key={index}
              ref={(ref) => {
                isCurrent
                  ? setCurrentMonthElement(ref)
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
    </div>
  )
}

export default observer(CalendarScroller)
