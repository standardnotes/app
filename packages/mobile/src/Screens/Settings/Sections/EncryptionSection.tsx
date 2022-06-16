import { useIsLocked } from '@Lib/SnjsHelperHooks'
import { ApplicationContext } from '@Root/ApplicationContext'
import { SectionHeader } from '@Root/Components/SectionHeader'
import { TableSection } from '@Root/Components/TableSection'
import { ContentType, StorageEncryptionPolicy } from '@standardnotes/snjs'
import React, { useContext, useEffect, useMemo, useState } from 'react'
import { BaseView, StyledSectionedTableCell, Subtitle, Title } from './EncryptionSection.styled'

type Props = {
  title: string
  encryptionAvailable: boolean
}

export const EncryptionSection = (props: Props) => {
  // Context
  const application = useContext(ApplicationContext)
  const [isLocked] = useIsLocked()

  // State
  const [protocolDisplayName, setProtocolDisplayName] = useState('')

  useEffect(() => {
    if (!props.encryptionAvailable) {
      return
    }

    let mounted = true
    const getProtocolDisplayName = async () => {
      const displayName = (await application?.getProtocolEncryptionDisplayName()) ?? ''
      if (mounted) {
        setProtocolDisplayName(displayName)
      }
    }
    void getProtocolDisplayName()
    return () => {
      mounted = false
    }
  }, [application, props.encryptionAvailable])

  const textData = useMemo(() => {
    const encryptionType = protocolDisplayName
    let encryptionStatus = props.encryptionAvailable ? 'Enabled' : 'Not Enabled'
    if (props.encryptionAvailable) {
      encryptionStatus += ` | ${encryptionType}`
    } else {
      encryptionStatus += '. '
      encryptionStatus +=
        application?.getStorageEncryptionPolicy() === StorageEncryptionPolicy.Default
          ? 'To enable encryption, sign in, register, or enable storage encryption.'
          : 'Sign in, register, or add a local passcode to enable encryption.'
    }
    let sourceString
    if (isLocked) {
      return { title: '', text: '' }
    } else {
      sourceString = application?.hasAccount() ? 'Account Keys' : 'Passcode'
    }

    const items = application!.items.getItems([ContentType.Note, ContentType.Tag])
    const itemsStatus = items.length + '/' + items.length + ' notes and tags encrypted'

    return {
      encryptionStatus,
      sourceString,
      itemsStatus,
    }
  }, [application, props.encryptionAvailable, isLocked, protocolDisplayName])

  return (
    <TableSection>
      <SectionHeader title={props.title} />

      <StyledSectionedTableCell last={!props.encryptionAvailable} first={true}>
        <BaseView>
          <Title>Encryption</Title>
          <Subtitle>{textData.encryptionStatus}</Subtitle>
        </BaseView>
      </StyledSectionedTableCell>

      {props.encryptionAvailable && (
        <StyledSectionedTableCell>
          <BaseView>
            <Title>Encryption Source</Title>
            <Subtitle>{textData.sourceString}</Subtitle>
          </BaseView>
        </StyledSectionedTableCell>
      )}

      {props.encryptionAvailable && (
        <StyledSectionedTableCell last>
          <BaseView>
            <Title>Items Encrypted</Title>
            <Subtitle>{textData.itemsStatus}</Subtitle>
          </BaseView>
        </StyledSectionedTableCell>
      )}
    </TableSection>
  )
}
