import { SectionHeader } from '@Root/Components/SectionHeader'
import { TableSection } from '@Root/Components/TableSection'
import { useSafeApplicationContext } from '@Root/Hooks/useSafeApplicationContext'
import {
  StyledSectionedTableCell,
  SubTitle,
  Title,
  useFilesInPreferencesStyles,
} from '@Screens/Settings/Sections/FilesSection.styled'
import { formatSizeToReadableString } from '@standardnotes/filepicker'
import { SubscriptionSettingName } from '@standardnotes/snjs'
import React, { FC, useContext, useEffect, useState } from 'react'
import { View } from 'react-native'
import { ThemeContext } from 'styled-components'

export const FilesSection: FC = () => {
  const application = useSafeApplicationContext()
  const theme = useContext(ThemeContext)
  const styles = useFilesInPreferencesStyles(theme)

  const [filesUsedQuota, setFilesUsedQuota] = useState(0)
  const [filesTotalQuota, setFilesTotalQuota] = useState(0)

  useEffect(() => {
    const getQuota = async () => {
      const { FileUploadBytesUsed, FileUploadBytesLimit } = SubscriptionSettingName

      const usedQuota = await application.settings.getSubscriptionSetting(FileUploadBytesUsed)
      const totalQuota = await application.settings.getSubscriptionSetting(FileUploadBytesLimit)

      setFilesUsedQuota(usedQuota ? parseFloat(usedQuota) : 0)
      setFilesTotalQuota(totalQuota ? parseFloat(totalQuota) : 0)
    }

    getQuota().catch(console.error)
  }, [application.settings])

  const usedQuotaRatioPercent = Math.round((filesUsedQuota * 100) / filesTotalQuota)

  return (
    <TableSection>
      <SectionHeader title={'Files'} />
      <StyledSectionedTableCell first>
        <View>
          <Title>Storage Quota</Title>
          <SubTitle>
            {formatSizeToReadableString(filesUsedQuota)} of {formatSizeToReadableString(filesTotalQuota)} used
          </SubTitle>
          <View style={styles.progressBarContainer}>
            <View style={{ ...styles.progressBar, width: `${usedQuotaRatioPercent}%` }} />
          </View>
        </View>
      </StyledSectionedTableCell>
    </TableSection>
  )
}
