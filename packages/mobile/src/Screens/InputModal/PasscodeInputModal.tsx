import { PasscodeKeyboardType, UnlockTiming } from '@Lib/ApplicationState'
import { ApplicationContext } from '@Root/ApplicationContext'
import { ButtonCell } from '@Root/Components/ButtonCell'
import { Option, SectionedOptionsTableCell } from '@Root/Components/SectionedOptionsTableCell'
import { SectionedTableCell } from '@Root/Components/SectionedTableCell'
import { TableSection } from '@Root/Components/TableSection'
import { ModalStackNavigationProp } from '@Root/ModalStack'
import { SCREEN_INPUT_MODAL_PASSCODE } from '@Root/Screens/screens'
import { ThemeServiceContext } from '@Style/ThemeService'
import React, { useContext, useMemo, useRef, useState } from 'react'
import { Keyboard, KeyboardType, Platform, TextInput } from 'react-native'
import { Container, Input } from './InputModal.styled'

type Props = ModalStackNavigationProp<typeof SCREEN_INPUT_MODAL_PASSCODE>
export const PasscodeInputModal = (props: Props) => {
  // Context
  const application = useContext(ApplicationContext)
  const themeService = useContext(ThemeServiceContext)

  // State
  const [settingPassocode, setSettingPassocode] = useState(false)
  const [text, setText] = useState('')
  const [confirmText, setConfirmText] = useState('')
  const [keyboardType, setKeyboardType] = useState<KeyboardType>('default')

  // Refs
  const textRef = useRef<TextInput>(null)
  const confirmTextRef = useRef<TextInput>(null)

  const onTextSubmit = () => {
    if (!confirmText) {
      confirmTextRef.current?.focus()
    } else {
      Keyboard.dismiss()
    }
  }

  const onSubmit = async () => {
    if (settingPassocode) {
      return
    }
    setSettingPassocode(true)
    if (text !== confirmText) {
      void application?.alertService?.alert(
        'The two values you entered do not match. Please try again.',
        'Invalid Confirmation',
        'OK',
      )
      setSettingPassocode(false)
    } else {
      await application?.addPasscode(text)
      await application?.getAppState().setPasscodeKeyboardType(keyboardType as PasscodeKeyboardType)
      await application?.getAppState().setPasscodeTiming(UnlockTiming.OnQuit)
      setSettingPassocode(false)
      props.navigation.goBack()
    }
  }

  const keyboardOptions: Option[] = useMemo(
    () => [
      {
        title: 'General',
        key: 'default' as PasscodeKeyboardType,
        selected: keyboardType === 'default',
      },
      {
        title: 'Numeric',
        key: 'numeric' as PasscodeKeyboardType,
        selected: keyboardType === 'numeric',
      },
    ],
    [keyboardType],
  )

  const onKeyboardTypeSelect = (option: Option) => {
    setKeyboardType(option.key as KeyboardType)
  }

  return (
    <Container>
      <TableSection>
        <SectionedTableCell textInputCell first={true}>
          <Input
            ref={textRef as any}
            key={Platform.OS === 'android' ? keyboardType + '1' : undefined}
            placeholder="Enter a passcode"
            onChangeText={setText}
            value={text}
            secureTextEntry
            autoCorrect={false}
            autoCapitalize={'none'}
            keyboardType={keyboardType}
            keyboardAppearance={themeService?.keyboardColorForActiveTheme()}
            autoFocus={true}
            underlineColorAndroid={'transparent'}
            onSubmitEditing={onTextSubmit}
          />
        </SectionedTableCell>

        <SectionedTableCell textInputCell first={false}>
          <Input
            ref={confirmTextRef as any}
            key={Platform.OS === 'android' ? keyboardType + '2' : undefined}
            placeholder="Confirm passcode"
            onChangeText={setConfirmText}
            value={confirmText}
            secureTextEntry
            autoCorrect={false}
            autoCapitalize={'none'}
            keyboardType={keyboardType}
            keyboardAppearance={themeService?.keyboardColorForActiveTheme()}
            underlineColorAndroid={'transparent'}
            onSubmitEditing={onSubmit}
          />
        </SectionedTableCell>

        <SectionedOptionsTableCell
          title={'Keyboard Type'}
          leftAligned
          options={keyboardOptions}
          onPress={onKeyboardTypeSelect}
        />

        <ButtonCell
          maxHeight={45}
          disabled={settingPassocode || text.length === 0}
          title={'Save'}
          bold
          onPress={onSubmit}
        />
      </TableSection>
    </Container>
  )
}
