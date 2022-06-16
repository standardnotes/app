import { SnIcon } from '@Root/Components/SnIcon'
import { IconType, SNNote } from '@standardnotes/snjs'
import React, { useContext } from 'react'
import { ThemeContext } from 'styled-components'
import styled from 'styled-components/native'

const FlagIconsContainer = styled.View`
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  margin-top: 2px;
`
type Props = {
  note: SNNote
}

type TFlagIcon = {
  icon: IconType
  fillColor?: string
}

export const NoteCellIconFlags = ({ note }: Props) => {
  const theme = useContext(ThemeContext)
  const { stylekitCorn, stylekitDangerColor, stylekitInfoColor } = theme

  const flagIcons = [] as TFlagIcon[]

  if (note.archived) {
    flagIcons.push({
      icon: 'archive',
      fillColor: stylekitCorn,
    })
  }
  if (note.locked) {
    flagIcons.push({
      icon: 'pencil-off',
      fillColor: stylekitInfoColor,
    })
  }
  if (note.trashed) {
    flagIcons.push({
      icon: 'trash-filled',
      fillColor: stylekitDangerColor,
    })
  }
  if (note.pinned) {
    flagIcons.push({
      icon: 'pin-filled',
      fillColor: stylekitInfoColor,
    })
  }
  return flagIcons.length ? (
    <FlagIconsContainer>
      {flagIcons.map((flagIcon, index) => (
        <SnIcon key={index} type={flagIcon.icon} fill={flagIcon.fillColor} />
      ))}
    </FlagIconsContainer>
  ) : null
}
