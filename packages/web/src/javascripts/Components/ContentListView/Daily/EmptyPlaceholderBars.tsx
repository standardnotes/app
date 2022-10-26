import { FunctionComponent, useEffect, useState } from 'react'

type Props = {
  rows: number
}

function randomNumber(min: number, max: number) {
  const r = Math.random() * (max - min) + min
  return Math.floor(r)
}

export const EmptyPlaceholderBars: FunctionComponent<Props> = ({ rows }) => {
  const [barWidths, setBarWidths] = useState<number[]>([])

  useEffect(() => {
    const widths = []
    for (let i = 0; i < rows; i++) {
      const width = randomNumber(70, 100)
      widths.push(width)
    }
    setBarWidths(widths)
  }, [rows])

  return (
    <div className="w-full">
      {barWidths.map((width, index) => {
        return (
          <div
            style={{ width: `${width}%` }}
            key={index}
            className={'my-4 h-7 bg-passive-4-opacity-variant pb-3'}
          ></div>
        )
      })}
    </div>
  )
}
