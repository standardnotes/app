import { AlwaysOpenWebAppOnLaunchKey } from '@Lib/constants'
import { ApplicationContext } from '@Root/ApplicationContext'
import { ButtonCell } from '@Root/Components/ButtonCell'
import { SectionHeader } from '@Root/Components/SectionHeader'
import { TableSection } from '@Root/Components/TableSection'
import { ButtonType, StorageValueModes } from '@standardnotes/snjs'
import React, { useContext } from 'react'
import styled from 'styled-components/native'
import { Label } from './CompanySection.styled'
import { BaseView, StyledSectionedTableCell } from './EncryptionSection.styled'

const Title = styled.Text`
  color: ${({ theme }) => theme.stylekitForegroundColor};
  font-size: 16px;
  font-weight: bold;
`

export const NewMobileSection = () => {
  const application = useContext(ApplicationContext)

  if (!application) {
    return <></>
  }

  const optIn = async () => {
    const confirmationText =
      'This will close the app and switch to the new mobile experience next time you open it. You will be able to switch back to the soon-to-be removed classic experience from the settings.'

    if (
      await application.alertService.confirm(
        confirmationText,
        'Switch To New Mobile Experience?',
        'Switch',
        ButtonType.Info,
      )
    ) {
      application.setValue(AlwaysOpenWebAppOnLaunchKey, true, StorageValueModes.Nonwrapped)
      setTimeout(() => application.deviceInterface.performSoftReset(), 1000)
    }
  }

  return (
    <TableSection>
      <SectionHeader title={'New Mobile Experience'} />

      <StyledSectionedTableCell last={true} first={true}>
        <BaseView>
          <Title>🎉 New Mobile Experience Preview</Title>
          <Label>
            The new mobile experience (MX) brings the desktop experience you've come to love right here on your mobile
            device. This mode will replace the existing classic mobile experience soon. You can opt in below to begin
            using the new MX now.
          </Label>
        </BaseView>
      </StyledSectionedTableCell>

      <ButtonCell leftAligned={true} title="Opt In to New Mobile Experience" onPress={optIn}></ButtonCell>
      <ButtonCell
        leftAligned={true}
        title="Read Blog Post"
        onPress={() => {
          application?.deviceInterface!.openUrl(
            'https://blog.standardnotes.com/38384/our-new-mobile-experience-is-launching-soon',
          )
        }}
      ></ButtonCell>
    </TableSection>
  )
}
