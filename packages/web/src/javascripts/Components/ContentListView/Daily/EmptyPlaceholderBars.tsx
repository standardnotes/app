import { FunctionComponent, useCallback, useEffect, useState } from 'react'

type Props = {
  rows: number
}

function randomNumber(min: number, max: number) {
  const r = Math.random() * (max - min) + min
  return Math.floor(r)
}

export const EmptyPlaceholderBars: FunctionComponent<Props> = ({ rows }) => {
  const [barWidths, setBarWidths] = useState<number[]>([])
  const [animationInterval, setAnimationInterval] = useState<ReturnType<typeof setTimeout> | null>(null)

  const reloadWidths = useCallback(() => {
    const widths = []
    for (let i = 0; i < rows; i++) {
      const width = randomNumber(70, 100)
      widths.push(width)
    }
    setBarWidths(widths)
  }, [setBarWidths, rows])

  useEffect(() => {
    reloadWidths()
  }, [rows, reloadWidths])

  const onHoverEnter = useCallback(() => {
    reloadWidths()

    const interval = setInterval(() => {
      reloadWidths()
    }, 750)

    setAnimationInterval(interval)
  }, [setAnimationInterval, reloadWidths])

  const onHoverExit = useCallback(() => {
    if (animationInterval) {
      clearInterval(animationInterval)
      setAnimationInterval(null)
    }
  }, [animationInterval, setAnimationInterval])

  return (
    <div onMouseEnter={onHoverEnter} onMouseLeave={onHoverExit} className="w-full">
      {barWidths.map((width, index) => {
        return (
          <div
            style={{ width: `${width}%` }}
            key={index}
            className={
              'transition-slowest ease my-4 h-7 bg-passive-4-opacity-variant pb-3 transition-width duration-1000'
            }
          ></div>
        )
      })}
    </div>
  )
}
