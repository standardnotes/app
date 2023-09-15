import { classNames } from '@standardnotes/snjs'

type Props = {
  count: string | number | undefined
  position: 'left' | 'right'
  className?: string
}

const CountBubble = ({ count, position, className }: Props) => {
  if (!count) {
    return null
  }

  return (
    <div
      className={classNames(
        'flex aspect-square h-5 w-5 items-center justify-center rounded-full border border-info-contrast bg-info text-[0.75rem] font-bold text-info-contrast md:text-[0.65rem]',
        'absolute bottom-full translate-y-3 md:translate-y-2',
        position === 'left' ? 'right-full md:translate-x-2' : 'left-full -translate-x-3 md:-translate-x-2.5',
        className,
      )}
    >
      {count}
    </div>
  )
}

export default CountBubble
