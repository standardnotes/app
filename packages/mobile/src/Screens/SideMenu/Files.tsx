import { SnIcon } from '@Components/SnIcon'
import { useNavigation } from '@react-navigation/native'
import { AppStackNavigationProp } from '@Root/AppStack'
import { useFiles } from '@Root/Hooks/useFiles'
import { useSafeApplicationContext } from '@Root/Hooks/useSafeApplicationContext'
import { SCREEN_COMPOSE, SCREEN_UPLOADED_FILES_LIST } from '@Root/Screens/screens'
import {
  FileItemContainer,
  FilesContainer,
  IconsContainer,
  SideMenuCellAttachNewFile,
  SideMenuCellShowAllFiles,
  SideMenuCellStyled,
  SNIconStyled,
  styles,
} from '@Root/Screens/SideMenu/Files.styled'
import { SideMenuOptionIconDescriptionType } from '@Root/Screens/SideMenu/SideMenuSection'
import { SideMenuCell } from '@Screens/SideMenu/SideMenuCell'
import { UploadedFileItemActionType } from '@Screens/UploadedFilesList/UploadedFileItemAction'
import { FeatureIdentifier } from '@standardnotes/features'
import { FeatureStatus, SNNote } from '@standardnotes/snjs'
import React, { FC } from 'react'

type Props = {
  note: SNNote
}

export const Files: FC<Props> = ({ note }) => {
  const application = useSafeApplicationContext()
  const filesService = application.getFilesService()

  const navigation = useNavigation<AppStackNavigationProp<typeof SCREEN_COMPOSE>['navigation']>()
  const { showActionsMenu, handlePressAttachFile, attachedFiles, handleFileAction } = useFiles({ note })

  const isEntitledToFiles = application.features.getFeatureStatus(FeatureIdentifier.Files) === FeatureStatus.Entitled

  const openFilesScreen = () => {
    navigation.navigate(SCREEN_UPLOADED_FILES_LIST, { note })
  }

  if (!isEntitledToFiles) {
    return (
      <SideMenuCell
        text={'Learn more'}
        onSelect={() => application.deviceInterface.openUrl('https://standardnotes.com/plans')}
        iconDesc={{
          side: 'left',
          type: SideMenuOptionIconDescriptionType.CustomComponent,
          value: <SnIcon type={'open-in'} style={styles.learnMoreIcon} />,
        }}
      />
    )
  }

  return (
    <FilesContainer>
      {attachedFiles.sort(filesService.sortByName).map(file => {
        const iconType = application.iconsController.getIconForFileType(file.mimeType)

        return (
          <FileItemContainer key={file.uuid}>
            <SideMenuCellStyled
              text={file.name}
              key={file.uuid}
              onSelect={() => {
                void handleFileAction({
                  type: UploadedFileItemActionType.PreviewFile,
                  payload: file,
                })
              }}
              onLongPress={() => showActionsMenu(file)}
              iconDesc={{
                side: 'right',
                type: SideMenuOptionIconDescriptionType.CustomComponent,
                value: (
                  <IconsContainer>
                    {file.protected && <SNIconStyled type={'lock-filled'} width={16} height={16} />}
                    <SNIconStyled type={iconType} width={16} height={16} />
                  </IconsContainer>
                ),
              }}
              cellContentStyle={styles.cellContentStyle}
            />
          </FileItemContainer>
        )
      })}
      <SideMenuCellAttachNewFile text={'Upload new file'} onSelect={() => handlePressAttachFile()} />
      <SideMenuCellShowAllFiles
        text={'Show all files'}
        onSelect={() => openFilesScreen()}
        cellContentStyle={styles.cellContentStyle}
      />
    </FilesContainer>
  )
}
