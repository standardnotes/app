import { ApplicationContext } from '@Root/ApplicationContext'
import { ButtonCell } from '@Root/Components/ButtonCell'
import { SectionedAccessoryTableCell } from '@Root/Components/SectionedAccessoryTableCell'
import { SectionedTableCell } from '@Root/Components/SectionedTableCell'
import { SectionHeader } from '@Root/Components/SectionHeader'
import { TableSection } from '@Root/Components/TableSection'
import { ThemeServiceContext } from '@Style/ThemeService'
import React, { useCallback, useContext, useEffect, useState } from 'react'
import { Keyboard } from 'react-native'
import { RegistrationDescription, RegistrationInput, RegularView } from './AuthSection.styled'

const DEFAULT_SIGN_IN_TEXT = 'Sign In'
const DEFAULT_REGISTER_TEXT = 'Register'
const SIGNIN_IN = 'Generating Keys...'

type Props = {
  title: string
  signedIn: boolean
}

export const AuthSection = (props: Props) => {
  // Context
  const application = useContext(ApplicationContext)
  const themeService = useContext(ThemeServiceContext)

  // State
  const [registering, setRegistering] = useState(false)
  const [signingIn, setSigningIn] = useState(false)
  const [strictSignIn, setStrictSignIn] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [server, setServer] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [confirmRegistration, setConfirmRegistration] = useState(false)

  // set initial server
  useEffect(() => {
    const getServer = async () => {
      const host = await application?.getHost()
      setServer(host!)
    }
    void getServer()
  }, [application])

  const updateServer = useCallback(
    async (host: string) => {
      setServer(host)
      await application?.setCustomHost(host)
    },
    [application],
  )
  if (props.signedIn) {
    return null
  }

  const validate = () => {
    if (!email) {
      void application?.alertService?.alert('Please enter a valid email address.', 'Missing Email', 'OK')
      return false
    }

    if (!password) {
      void application?.alertService?.alert('Please enter your password.', 'Missing Password', 'OK')
      return false
    }

    return true
  }

  const signIn = async () => {
    setSigningIn(true)
    if (!validate()) {
      setSigningIn(false)
      return
    }
    Keyboard.dismiss()
    const result = await application!.signIn(email, password, strictSignIn, undefined, true, false)

    if (result?.error) {
      if (result?.error.message) {
        void application?.alertService?.alert(result?.error.message)
      }
      setSigningIn(false)
      return
    }

    setSigningIn(false)
    setPassword('')
    setPasswordConfirmation('')
  }

  const onRegisterPress = () => {
    if (!validate()) {
      return
    }
    setConfirmRegistration(true)
  }

  const register = async () => {
    setRegistering(true)
    if (password !== passwordConfirmation) {
      void application?.alertService?.alert(
        'The passwords you entered do not match. Please try again.',
        "Passwords Don't Match",
        'OK',
      )
    } else {
      try {
        Keyboard.dismiss()
        await application!.register(email, password, undefined, true)
      } catch (error) {
        void application?.alertService?.alert((error as Error).message)
      }
    }
    setRegistering(false)
  }

  const _renderRegistrationConfirm = () => {
    return (
      <TableSection>
        <SectionHeader title={'Confirm Password'} />

        <RegistrationDescription>
          Due to the nature of our encryption, Standard Notes cannot offer password reset functionality. If you forget
          your password, you will permanently lose access to your data.
        </RegistrationDescription>

        <SectionedTableCell first textInputCell>
          <RegistrationInput
            testID="passwordConfirmationField"
            placeholder={'Password confirmation'}
            onChangeText={setPasswordConfirmation}
            value={passwordConfirmation}
            secureTextEntry
            autoFocus
            keyboardAppearance={themeService?.keyboardColorForActiveTheme()}
          />
        </SectionedTableCell>

        <ButtonCell
          testID="registerConfirmButton"
          disabled={registering}
          title={registering ? 'Generating Keys...' : 'Register'}
          bold
          onPress={register}
        />

        <ButtonCell
          title="Cancel"
          onPress={() => {
            setConfirmRegistration(false)
            setPasswordConfirmation('')
            setPassword('')
          }}
        />
      </TableSection>
    )
  }

  const _renderDefaultContent = () => {
    const keyboardApperance = themeService?.keyboardColorForActiveTheme()

    return (
      <TableSection>
        {props.title && <SectionHeader title={props.title} />}

        <>
          <RegularView>
            <SectionedTableCell textInputCell first>
              <RegistrationInput
                testID="emailField"
                placeholder={'Email'}
                onChangeText={setEmail}
                value={email ?? undefined}
                autoCorrect={false}
                autoCapitalize={'none'}
                keyboardType={'email-address'}
                textContentType={'emailAddress'}
                keyboardAppearance={keyboardApperance}
              />
            </SectionedTableCell>

            <SectionedTableCell textInputCell>
              <RegistrationInput
                testID="passwordField"
                placeholder={'Password'}
                onChangeText={setPassword}
                value={password ?? undefined}
                textContentType={'password'}
                secureTextEntry
                keyboardAppearance={keyboardApperance}
              />
            </SectionedTableCell>
          </RegularView>

          {(showAdvanced || !server) && (
            <RegularView>
              <SectionHeader title={'Advanced'} />
              <SectionedTableCell textInputCell first>
                <RegistrationInput
                  testID="syncServerField"
                  placeholder={'Sync Server'}
                  onChangeText={updateServer}
                  value={server}
                  autoCorrect={false}
                  autoCapitalize={'none'}
                  keyboardType={'url'}
                  keyboardAppearance={keyboardApperance}
                />
              </SectionedTableCell>

              <SectionedAccessoryTableCell
                onPress={() => setStrictSignIn(!strictSignIn)}
                text={'Use strict sign in'}
                selected={() => {
                  return strictSignIn
                }}
              />
            </RegularView>
          )}
        </>

        <ButtonCell
          testID="signInButton"
          title={signingIn ? SIGNIN_IN : DEFAULT_SIGN_IN_TEXT}
          disabled={signingIn}
          bold={true}
          onPress={signIn}
        />

        <ButtonCell
          testID="registerButton"
          title={DEFAULT_REGISTER_TEXT}
          disabled={registering}
          bold
          onPress={onRegisterPress}
        />

        {!showAdvanced && (
          <ButtonCell testID="advancedOptionsButton" title="Advanced Options" onPress={() => setShowAdvanced(true)} />
        )}
      </TableSection>
    )
  }

  return (
    <RegularView>
      {confirmRegistration && _renderRegistrationConfirm()}

      {!confirmRegistration && _renderDefaultContent()}
    </RegularView>
  )
}
