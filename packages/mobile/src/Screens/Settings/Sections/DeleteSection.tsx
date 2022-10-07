import { ApplicationContext } from '@Root/ApplicationContext'
import { ButtonCell } from '@Root/Components/ButtonCell'
import { SectionHeader } from '@Root/Components/SectionHeader'
import { TableSection } from '@Root/Components/TableSection'
import { ButtonType } from '@standardnotes/snjs'
import React, { useContext, useState } from 'react'
import { RegularView } from './AuthSection.styled'

export const DeleteSection = () => {
  const application = useContext(ApplicationContext)
  const [deleting, setDeleting] = useState(false)

  const deleteAccount = async () => {
    const message =
      "This action is irreversible. After deletion completes, you will be signed out on all devices, and this application will exit. If you have an active paid subscription, cancel the subscription first. Otherwise, if you'd like to keep the subscription, you can re-register with the same email after deletion, and your subscription will be linked back up with your account."
    const confirmed = await application!.alertService.confirm(
      message,
      'Are you sure?',
      'Delete Account',
      ButtonType.Danger,
    )

    if (!confirmed) {
      return
    }

    setDeleting(true)

    const result = await application!.user.deleteAccount()
    if (result.error) {
      application!.alertService.alert('An error occurred while deleting your account. Please try again.')
    }
  }

  return (
    <RegularView>
      <SectionHeader />
      <TableSection>
        <ButtonCell
          first
          last
          important
          leftAligned={true}
          title={deleting ? 'Deleting...' : 'Delete Account'}
          onPress={deleteAccount}
        ></ButtonCell>
      </TableSection>
    </RegularView>
  )
}
