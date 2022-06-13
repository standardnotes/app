import { ButtonCell } from '@Root/Components/ButtonCell'
import { SectionedTableCell } from '@Root/Components/SectionedTableCell'
import { TableSection } from '@Root/Components/TableSection'
import { useSafeApplicationContext } from '@Root/Hooks/useSafeApplicationContext'
import { ModalStackNavigationProp } from '@Root/ModalStack'
import { SCREEN_INPUT_MODAL_WORKSPACE_NAME } from '@Root/Screens/screens'
import { ThemeServiceContext } from '@Style/ThemeService'
import React, { FC, useContext, useEffect, useRef, useState } from 'react'
import { TextInput } from 'react-native'
import { Container, Input } from './InputModal.styled'

type Props = ModalStackNavigationProp<typeof SCREEN_INPUT_MODAL_WORKSPACE_NAME>

export const WorkspaceInputModal: FC<Props> = props => {
  const { descriptor, renameWorkspace } = props.route.params
  const themeService = useContext(ThemeServiceContext)
  const application = useSafeApplicationContext()

  const workspaceNameInputRef = useRef<TextInput>(null)

  const [workspaceName, setWorkspaceName] = useState(descriptor.label)

  const onSubmit = async () => {
    const trimmedWorkspaceName = workspaceName.trim()
    if (trimmedWorkspaceName === '') {
      setWorkspaceName(descriptor.label)
      await application?.alertService.alert('Workspace name cannot be empty')
      workspaceNameInputRef.current?.focus()
      return
    }
    await renameWorkspace(descriptor, trimmedWorkspaceName)
    void application.sync.sync()
    props.navigation.goBack()
  }

  useEffect(() => {
    workspaceNameInputRef.current?.focus()
  }, [])

  return (
    <Container>
      <TableSection>
        <SectionedTableCell textInputCell first={true}>
          <Input
            ref={workspaceNameInputRef as any}
            placeholder={'Workspace name'}
            onChangeText={setWorkspaceName}
            value={workspaceName}
            autoCorrect={false}
            autoCapitalize={'none'}
            keyboardAppearance={themeService?.keyboardColorForActiveTheme()}
            underlineColorAndroid={'transparent'}
            onSubmitEditing={onSubmit}
          />
        </SectionedTableCell>

        <ButtonCell maxHeight={45} disabled={workspaceName.length === 0} title={'Save'} bold onPress={onSubmit} />
      </TableSection>
    </Container>
  )
}
