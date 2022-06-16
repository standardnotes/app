import React, { useEffect, useState } from 'react'
import styled from 'styled-components'

const ProgressBarBackground = styled.circle`
  fill: none;
  stroke: var(--sn-stylekit-neutral-color);
`

const ProgressBarStroke = styled.circle`
  fill: none;
  stroke: var(--sn-stylekit-info-color);
  transition: all 0.5s;
`

type CircularProgressBarProps = {
  size: number
  percentage: number
}

export const CircularProgressBar: React.FC<CircularProgressBarProps> = ({ size, percentage }) => {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    setProgress(percentage)
  }, [percentage])

  const viewBox = `0 0 ${size} ${size}`
  const strokeWidth = size * (0.1 / 100) * 100 + 1
  const radius = (size - strokeWidth) / 2
  const circumference = radius * Math.PI * 2
  const dash = (progress * circumference) / 100

  return (
    <svg height={size} viewBox={viewBox} width={size} data-testid="circular-progress-bar">
      <ProgressBarBackground cx={size / 2} cy={size / 2} r={radius} strokeWidth={strokeWidth} />
      <ProgressBarStroke
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={strokeWidth}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        strokeDasharray={`${dash} ${circumference - dash}`}
        strokeLinecap="round"
        style={{ transition: 'all 0.5s' }}
      />
    </svg>
  )
}
