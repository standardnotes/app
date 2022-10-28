import { FunctionComponent } from 'react'

type Props = {
  day: number
  isToday: boolean
  onClick: () => void
  type: 'empty' | 'item' | 'template'
  isLastMonth: boolean
}

const CalendarDay: FunctionComponent<Props> = ({ day, type, isToday, onClick, isLastMonth }) => {
  let classNames = ''
  if (isToday) {
    classNames += 'bg-danger text-danger-contrast font-bold'
  } else if (isLastMonth) {
    classNames += 'text-passive-3'
  } else {
    if (type === 'empty') {
      classNames += 'bg-transparent hover:bg-contrast'
    } else if (type === 'item') {
      classNames += 'bg-danger-light text-danger font-bold'
    } else {
      classNames += 'bg-contrast'
    }
  }

  return (
    <div className="h-7 w-[14.2%] p-0.5">
      <div
        className={`${classNames} flex h-full w-full cursor-pointer items-center justify-center rounded`}
        key={day}
        onClick={onClick}
      >
        {day}
      </div>
    </div>
  )
}

export default CalendarDay
