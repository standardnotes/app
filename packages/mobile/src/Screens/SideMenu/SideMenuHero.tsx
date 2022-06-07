import { useIsLocked, useOutOfSync, useSignedIn } from '@Lib/SnjsHelperHooks'
import { ApplicationContext } from '@Root/ApplicationContext'
import { Circle } from '@Root/Components/Circle'
import { ContentType } from '@standardnotes/snjs'
import React, { useContext, useEffect, useMemo, useState } from 'react'
import { ViewProps } from 'react-native'
import { ThemeContext } from 'styled-components'
import { Cell, IconCircle, OutOfSyncContainer, OutOfSyncLabel, SubTitle, Title, Touchable } from './SideMenuHero.styled'

type Props = {
  onPress: () => void
  onOutOfSyncPress: () => void
  testID: ViewProps['testID']
}

export const SideMenuHero: React.FC<Props> = props => {
  // Context
  const application = useContext(ApplicationContext)
  const theme = useContext(ThemeContext)

  // State
  const [signedIn] = useSignedIn()
  const [isLocked] = useIsLocked()
  const [isOutOfSync] = useOutOfSync()
  const [itemsCount, setItemsCount] = useState(0)

  useEffect(() => {
    const observedContentTypes = [ContentType.Note, ContentType.Tag]
    const removeStreamItems = application?.streamItems(observedContentTypes, _items => {
      const notesAndTagsCount = application?.items.getItems(observedContentTypes).length ?? 0

      if (notesAndTagsCount !== itemsCount) {
        setItemsCount(notesAndTagsCount)
      }
    })

    return removeStreamItems
  }, [application, itemsCount])

  const textData = useMemo(() => {
    const hasEncryption = application?.isEncryptionAvailable()
    if (!signedIn) {
      return {
        title: 'Data Not Backed Up',
        text: hasEncryption
          ? 'Sign in or register to enable sync to your other devices.'
          : 'Sign in or register to add encryption and enable sync to your other devices.',
      }
    } else if (!isLocked) {
      const user = application?.getUser()
      const email = user?.email
      const itemsStatus = itemsCount + '/' + itemsCount + ' notes and tags encrypted'
      return {
        title: email,
        text: itemsStatus,
      }
    } else {
      return { text: '', title: '' }
    }
  }, [application, signedIn, itemsCount, isLocked])

  return (
    <Cell>
      <Touchable testID={props.testID} onPress={props.onPress}>
        <Title>{textData.title}</Title>
      </Touchable>
      <Touchable onPress={props.onPress}>
        <SubTitle>{textData.text}</SubTitle>
      </Touchable>
      {isOutOfSync && (
        <OutOfSyncContainer onPress={props.onOutOfSyncPress}>
          <IconCircle>
            <Circle size={10} backgroundColor={theme.stylekitWarningColor} borderColor={theme.stylekitWarningColor} />
          </IconCircle>
          <OutOfSyncLabel>Potentially Out of Sync</OutOfSyncLabel>
        </OutOfSyncContainer>
      )}
    </Cell>
  )
}
