import { AppStateType, PasscodeKeyboardType } from '@Lib/ApplicationState'
import { MobileDeviceInterface } from '@Lib/Interface'
import { HeaderHeightContext } from '@react-navigation/elements'
import { useFocusEffect } from '@react-navigation/native'
import { ApplicationContext } from '@Root/ApplicationContext'
import { ButtonCell } from '@Root/Components/ButtonCell'
import { IoniconsHeaderButton } from '@Root/Components/IoniconsHeaderButton'
import { SectionedAccessoryTableCell } from '@Root/Components/SectionedAccessoryTableCell'
import { SectionedTableCell } from '@Root/Components/SectionedTableCell'
import { SectionHeader } from '@Root/Components/SectionHeader'
import { ModalStackNavigationProp } from '@Root/ModalStack'
import { SCREEN_AUTHENTICATE } from '@Root/Screens/screens'
import { ChallengeReason, ChallengeValidation, ChallengeValue, ProtectionSessionDurations } from '@standardnotes/snjs'
import { ICON_CLOSE } from '@Style/Icons'
import { ThemeService, ThemeServiceContext } from '@Style/ThemeService'
import React, { useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { Alert, BackHandler, Keyboard, Platform, ScrollView, TextInput } from 'react-native'
import FingerprintScanner from 'react-native-fingerprint-scanner'
import { hide } from 'react-native-privacy-snapshot'
import { HeaderButtons, Item } from 'react-navigation-header-buttons'
import styled, { ThemeContext } from 'styled-components'
import {
  BaseView,
  Input,
  SectionContainer,
  SessionLengthContainer,
  SourceContainer,
  StyledKeyboardAvoidingView,
  StyledSectionedTableCell,
  StyledTableSection,
  Subtitle,
  Title,
} from './Authenticate.styled'
import {
  authenticationReducer,
  AuthenticationValueStateType,
  findIndexInObject,
  getChallengePromptTitle,
  getLabelForStateAndType,
  isInActiveState,
} from './helpers'

type Props = ModalStackNavigationProp<typeof SCREEN_AUTHENTICATE>

function isValidChallengeValue(challengeValue: ChallengeValue): boolean {
  switch (challengeValue.prompt.validation) {
    case ChallengeValidation.ProtectionSessionDuration:
      return typeof challengeValue.value === 'number'
    default:
      return !!challengeValue.value
  }
}

const ItemStyled = styled(Item)`
  width: 100px;
`

export const Authenticate = ({
  route: {
    params: { challenge },
  },
  navigation,
}: Props) => {
  // Context
  const application = useContext(ApplicationContext)
  const themeService = useContext(ThemeServiceContext)
  const theme = useContext(ThemeContext)

  // State
  const [supportsBiometrics, setSupportsBiometrics] = useState<boolean | undefined>(undefined)
  const [passcodeKeyboardType, setPasscodeKeyboardType] = useState<PasscodeKeyboardType | undefined>(
    PasscodeKeyboardType.Default,
  )
  const [singleValidation] = useState(() => !(challenge.prompts.filter(prompt => prompt.validates).length > 0))
  const [showSwitchKeyboard, setShowSwitchKeyboard] = useState<boolean>(false)

  const [{ challengeValues, challengeValueStates }, dispatch] = useReducer(
    authenticationReducer,
    {
      challengeValues: challenge.prompts.reduce((map, current) => {
        map[current.id] = {
          prompt: current,
          value: current.initialValue ?? null,
        } as ChallengeValue
        return map
      }, {} as Record<string, ChallengeValue>),
      challengeValueStates: challenge.prompts.reduce((map, current, index) => {
        if (index === 0) {
          map[current.id] = AuthenticationValueStateType.WaitingInput
        } else {
          map[current.id] = AuthenticationValueStateType.WaitingTurn
        }
        return map
      }, {} as Record<string, AuthenticationValueStateType>),
    },
    undefined,
  )
  const [pending, setPending] = useState(false)

  // Refs
  const isAuthenticating = useRef(false)
  const firstInputRef = useRef<TextInput>(null)
  const secondInputRef = useRef<TextInput>(null)
  const thirdInputRef = useRef<TextInput>(null)
  const fourthInputRef = useRef<TextInput>(null)

  React.useLayoutEffect(() => {
    if (challenge.cancelable) {
      navigation.setOptions({
        headerLeft: ({ disabled }) => (
          <HeaderButtons HeaderButtonComponent={IoniconsHeaderButton}>
            <ItemStyled
              testID="headerButton"
              disabled={disabled || pending}
              title={Platform.OS === 'ios' ? 'Cancel' : ''}
              iconName={Platform.OS === 'ios' ? undefined : ThemeService.nameForIcon(ICON_CLOSE)}
              onPress={() => {
                if (!pending) {
                  application?.cancelChallenge(challenge)
                }
              }}
            />
          </HeaderButtons>
        ),
      })
    }
  }, [navigation, challenge, application, pending])

  const validateChallengeValue = useCallback(
    async (challengeValue: ChallengeValue) => {
      if (singleValidation) {
        setPending(true)
        return application?.submitValuesForChallenge(challenge, Object.values(challengeValues))
      } else {
        const state = challengeValueStates[challengeValue.prompt.id]

        if (
          state === AuthenticationValueStateType.Locked ||
          state === AuthenticationValueStateType.Success ||
          !isValidChallengeValue(challengeValue)
        ) {
          return
        }
        return application?.submitValuesForChallenge(challenge, [challengeValue])
      }
    },
    [challengeValueStates, singleValidation, challengeValues, application, challenge],
  )

  const onValueLocked = useCallback((challengeValue: ChallengeValue) => {
    dispatch({
      type: 'setState',
      id: challengeValue.prompt.id.toString(),
      state: AuthenticationValueStateType.Locked,
    })

    setTimeout(() => {
      dispatch({
        type: 'setState',
        id: challengeValue.prompt.id.toString(),
        state: AuthenticationValueStateType.WaitingTurn,
      })
    }, 30 * 1000)
  }, [])

  const checkForBiometrics = useCallback(
    async () => (application?.deviceInterface as MobileDeviceInterface).getDeviceBiometricsAvailability(),
    [application],
  )

  const checkPasscodeKeyboardType = useCallback(
    async () => application?.getAppState().getPasscodeKeyboardType(),
    [application],
  )

  const authenticateBiometrics = useCallback(
    async (challengeValue: ChallengeValue) => {
      let hasBiometrics = supportsBiometrics
      if (supportsBiometrics === undefined) {
        hasBiometrics = await checkForBiometrics()
        setSupportsBiometrics(hasBiometrics)
      }
      if (!hasBiometrics) {
        FingerprintScanner.release()
        dispatch({
          type: 'setState',
          id: challengeValue.prompt.id.toString(),
          state: AuthenticationValueStateType.Fail,
        })
        Alert.alert('Unsuccessful', 'This device either does not have a biometric sensor or it may not configured.')
        return
      }

      dispatch({
        type: 'setState',
        id: challengeValue.prompt.id.toString(),
        state: AuthenticationValueStateType.Pending,
      })

      if (application?.getAppState().screenshotPrivacyEnabled) {
        hide()
      }

      if (Platform.OS === 'android') {
        await application?.getAppState().performActionWithoutStateChangeImpact(async () => {
          isAuthenticating.current = true
          FingerprintScanner.authenticate({
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore ts type does not exist for deviceCredentialAllowed
            deviceCredentialAllowed: true,
            description: 'Biometrics are required to access your notes.',
          })
            .then(() => {
              FingerprintScanner.release()
              const newChallengeValue = { ...challengeValue, value: true }

              onValueChange(newChallengeValue)
              return validateChallengeValue(newChallengeValue)
            })
            .catch(error => {
              FingerprintScanner.release()
              if (error.name === 'DeviceLocked') {
                onValueLocked(challengeValue)
                Alert.alert('Unsuccessful', 'Authentication failed. Wait 30 seconds to try again.')
              } else {
                dispatch({
                  type: 'setState',
                  id: challengeValue.prompt.id.toString(),
                  state: AuthenticationValueStateType.Fail,
                })
                Alert.alert('Unsuccessful', 'Authentication failed. Tap to try again.')
              }
            })
            .finally(() => {
              isAuthenticating.current = false
            })
        }, true)
      } else {
        // iOS
        await application?.getAppState().performActionWithoutStateChangeImpact(async () => {
          isAuthenticating.current = true
          FingerprintScanner.authenticate({
            fallbackEnabled: true,
            description: 'This is required to access your notes.',
          })
            .then(() => {
              FingerprintScanner.release()

              const newChallengeValue = { ...challengeValue, value: true }
              onValueChange(newChallengeValue)
              return validateChallengeValue(newChallengeValue)
            })
            .catch(error_1 => {
              onValueChange({ ...challengeValue, value: false })
              FingerprintScanner.release()
              if (error_1.name !== 'SystemCancel') {
                if (error_1.name !== 'UserCancel') {
                  Alert.alert('Unsuccessful')
                } else {
                  Alert.alert('Unsuccessful', 'Authentication failed. Tap to try again.')
                }
              }
              dispatch({
                type: 'setState',
                id: challengeValue.prompt.id.toString(),
                state: AuthenticationValueStateType.Fail,
              })
            })
            .finally(() => {
              isAuthenticating.current = false
            })
        }, true)
      }
    },
    [application, checkForBiometrics, onValueLocked, supportsBiometrics, validateChallengeValue],
  )

  const firstNotSuccessful = useMemo(() => {
    for (const id in challengeValueStates) {
      if (challengeValueStates[id] !== AuthenticationValueStateType.Success) {
        return id
      }
    }
    return
  }, [challengeValueStates])

  const beginAuthenticatingForNextChallengeReason = useCallback(
    (completedChallengeValue?: ChallengeValue) => {
      let challengeValue
      if (completedChallengeValue === undefined) {
        challengeValue = challengeValues[firstNotSuccessful!]
      } else {
        const index = findIndexInObject(challengeValues, completedChallengeValue.prompt.id.toString())

        const hasNextItem = Object.prototype.hasOwnProperty.call(Object.keys(challengeValues), index + 1)
        if (!hasNextItem) {
          return
        }
        const nextItemId = Object.keys(challengeValues)[index + 1]
        challengeValue = challengeValues[nextItemId]
      }

      /**
       * Authentication modal may be displayed on lose focus just before the app
       * is closing. In this state however, we don't want to begin auth. We'll
       * wait until the app gains focus.
       */
      const isLosingFocusOrInBackground =
        application?.getAppState().getMostRecentState() === AppStateType.LosingFocus ||
        application?.getAppState().getMostRecentState() === AppStateType.EnteringBackground

      if (challengeValue.prompt.validation === ChallengeValidation.Biometric && !isLosingFocusOrInBackground) {
        /** Begin authentication right away, we're not waiting for any input */
        void authenticateBiometrics(challengeValue)
      } else {
        const index = findIndexInObject(challengeValues, challengeValue.prompt.id.toString())
        switch (index) {
          case 0:
            firstInputRef.current?.focus()
            break
          case 1:
            secondInputRef.current?.focus()
            break
          case 2:
            thirdInputRef.current?.focus()
            break
          case 3:
            fourthInputRef.current?.focus()
            break
        }
      }

      dispatch({
        type: 'setState',
        id: challengeValue.prompt.id.toString(),
        state: AuthenticationValueStateType.WaitingInput,
      })
    },
    [application, authenticateBiometrics, challengeValues, firstNotSuccessful],
  )

  useEffect(() => {
    const remove = application?.getAppState().addStateChangeObserver(state => {
      if (state === AppStateType.ResumingFromBackground) {
        if (!isAuthenticating.current) {
          beginAuthenticatingForNextChallengeReason()
        }
      } else if (state === AppStateType.EnteringBackground) {
        FingerprintScanner.release()
        dispatch({
          type: 'setState',
          id: firstNotSuccessful!,
          state: AuthenticationValueStateType.WaitingInput,
        })
      }
    })
    return remove
  }, [application, beginAuthenticatingForNextChallengeReason, challengeValueStates, firstNotSuccessful])

  const onValidValue = useCallback(
    (value: ChallengeValue) => {
      setPending(false)
      dispatch({
        type: 'setState',
        id: value.prompt.id.toString(),
        state: AuthenticationValueStateType.Success,
      })
      beginAuthenticatingForNextChallengeReason(value)
    },
    [beginAuthenticatingForNextChallengeReason],
  )

  const onInvalidValue = (value: ChallengeValue) => {
    setPending(false)
    dispatch({
      type: 'setState',
      id: value.prompt.id.toString(),
      state: AuthenticationValueStateType.Fail,
    })
  }

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    let removeObserver: () => void = () => {}
    if (application?.addChallengeObserver) {
      removeObserver = application?.addChallengeObserver(challenge, {
        onValidValue,
        onInvalidValue,
        onComplete: () => {
          navigation.goBack()
        },
        onCancel: () => {
          navigation.goBack()
        },
      })
    }
    return removeObserver
  }, [application, challenge, navigation, onValidValue])

  useEffect(() => {
    let mounted = true
    const setBiometricsAsync = async () => {
      if (challenge.reason === ChallengeReason.ApplicationUnlock) {
        const hasBiometrics = await checkForBiometrics()
        if (mounted) {
          setSupportsBiometrics(hasBiometrics)
        }
      }
    }
    void setBiometricsAsync()
    const setInitialPasscodeKeyboardType = async () => {
      const initialPasscodeKeyboardType = await checkPasscodeKeyboardType()
      if (mounted) {
        setPasscodeKeyboardType(initialPasscodeKeyboardType)
      }
    }
    void setInitialPasscodeKeyboardType()
    return () => {
      mounted = false
    }
  }, [challenge.reason, checkForBiometrics, checkPasscodeKeyboardType])

  /**
   * Authenticate for challenge reasons like biometrics as soon as possible,
   * unless a prompt has a prefilled control value, in which case give the
   * option to adjust them first.
   */
  useEffect(() => {
    if (
      challenge.prompts &&
      challenge.prompts.length > 0 &&
      challenge.prompts[0].validation !== ChallengeValidation.ProtectionSessionDuration
    ) {
      beginAuthenticatingForNextChallengeReason()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onBiometricDirectPress = () => {
    Keyboard.dismiss()

    const biometricChallengeValue = Object.values(challengeValues).find(
      value => value.prompt.validation === ChallengeValidation.Biometric,
    )
    const state = challengeValueStates[biometricChallengeValue?.prompt.id as number]
    if (state === AuthenticationValueStateType.Locked || state === AuthenticationValueStateType.Success) {
      return
    }

    beginAuthenticatingForNextChallengeReason()
  }

  const onValueChange = (newValue: ChallengeValue, dismissKeyboard = false) => {
    if (dismissKeyboard) {
      Keyboard.dismiss()
    }

    dispatch({
      type: 'setValue',
      id: newValue.prompt.id.toString(),
      value: newValue.value,
    })
  }

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        // Always block back button on Android
        return true
      }

      BackHandler.addEventListener('hardwareBackPress', onBackPress)

      return () => BackHandler.removeEventListener('hardwareBackPress', onBackPress)
    }, []),
  )

  const onSubmitPress = () => {
    const challengeValue = challengeValues[firstNotSuccessful!]
    if (!isValidChallengeValue(challengeValue)) {
      return
    }
    if (singleValidation) {
      void validateChallengeValue(challengeValue)
    } else {
      const state = challengeValueStates[firstNotSuccessful!]
      if (
        challengeValue.prompt.validation === ChallengeValidation.Biometric &&
        (state === AuthenticationValueStateType.Locked || state === AuthenticationValueStateType.Fail)
      ) {
        beginAuthenticatingForNextChallengeReason()
        return
      }
      void validateChallengeValue(challengeValue)
    }
  }

  const switchKeyboard = () => {
    if (passcodeKeyboardType === PasscodeKeyboardType.Numeric) {
      setPasscodeKeyboardType(PasscodeKeyboardType.Default)
    } else {
      setPasscodeKeyboardType(PasscodeKeyboardType.Numeric)
    }
  }

  const readyToSubmit = useMemo(
    () =>
      Object.values(challengeValues)
        .map(challengeValue => challengeValue.value)
        .filter(value => !value).length === 0,
    [challengeValues],
  )

  const renderAuthenticationSource = (challengeValue: ChallengeValue, index: number) => {
    const last = index === Object.keys(challengeValues).length - 1
    const state = challengeValueStates[challengeValue.prompt.id]
    const active = isInActiveState(state)
    const isBiometric = challengeValue.prompt.validation === ChallengeValidation.Biometric
    const isProtectionSessionDuration =
      challengeValue.prompt.validation === ChallengeValidation.ProtectionSessionDuration
    const isInput = !isBiometric && !isProtectionSessionDuration
    const stateLabel = getLabelForStateAndType(challengeValue.prompt.validation, state)

    const stateTitle = getChallengePromptTitle(challengeValue.prompt, state)

    const keyboardType =
      challengeValue.prompt.keyboardType ??
      (challengeValue.prompt.validation === ChallengeValidation.LocalPasscode ? passcodeKeyboardType : 'default')

    return (
      <SourceContainer key={challengeValue.prompt.id}>
        <StyledTableSection last={last}>
          <SectionHeader
            title={stateTitle}
            subtitle={isInput ? stateLabel : undefined}
            tinted={active}
            buttonText={
              challengeValue.prompt.validation === ChallengeValidation.LocalPasscode && showSwitchKeyboard
                ? 'Change Keyboard'
                : undefined
            }
            buttonAction={switchKeyboard}
            buttonStyles={
              challengeValue.prompt.validation === ChallengeValidation.LocalPasscode
                ? {
                    color: theme.stylekitNeutralColor,
                    fontSize: theme.mainTextFontSize - 5,
                  }
                : undefined
            }
          />
          {isInput && (
            <SectionContainer>
              <SectionedTableCell textInputCell={true} first={true}>
                <Input
                  key={Platform.OS === 'android' ? keyboardType : undefined}
                  ref={Array.of(firstInputRef, secondInputRef, thirdInputRef, fourthInputRef)[index] as any}
                  placeholder={challengeValue.prompt.placeholder}
                  onChangeText={text => {
                    onValueChange({ ...challengeValue, value: text })
                  }}
                  value={(challengeValue.value || '') as string}
                  autoCorrect={false}
                  autoFocus={false}
                  autoCapitalize={'none'}
                  secureTextEntry={challengeValue.prompt.secureTextEntry}
                  keyboardType={keyboardType}
                  keyboardAppearance={themeService?.keyboardColorForActiveTheme()}
                  underlineColorAndroid={'transparent'}
                  onSubmitEditing={
                    !singleValidation
                      ? () => {
                          void validateChallengeValue(challengeValue)
                        }
                      : undefined
                  }
                  onFocus={() => setShowSwitchKeyboard(true)}
                  onBlur={() => setShowSwitchKeyboard(false)}
                />
              </SectionedTableCell>
            </SectionContainer>
          )}
          {isBiometric && (
            <SectionContainer>
              <SectionedAccessoryTableCell
                first={true}
                dimmed={active}
                tinted={active}
                text={stateLabel}
                onPress={onBiometricDirectPress}
              />
            </SectionContainer>
          )}
          {isProtectionSessionDuration && (
            <SessionLengthContainer>
              {ProtectionSessionDurations.map((duration, i) => (
                <SectionedAccessoryTableCell
                  text={duration.label}
                  key={duration.valueInSeconds}
                  first={i === 0}
                  last={i === ProtectionSessionDurations.length - 1}
                  selected={() => {
                    return duration.valueInSeconds === challengeValue.value
                  }}
                  onPress={() => {
                    onValueChange(
                      {
                        ...challengeValue,
                        value: duration.valueInSeconds,
                      },
                      true,
                    )
                  }}
                />
              ))}
            </SessionLengthContainer>
          )}
        </StyledTableSection>
      </SourceContainer>
    )
  }

  const isPending = useMemo(
    () => Object.values(challengeValueStates).findIndex(state => state === AuthenticationValueStateType.Pending) >= 0,
    [challengeValueStates],
  )

  let submitButtonTitle: 'Submit' | 'Next'
  if (singleValidation) {
    submitButtonTitle = 'Submit'
  } else if (!firstNotSuccessful) {
    submitButtonTitle = 'Next'
  } else {
    const stateKeys = Object.keys(challengeValueStates)
    submitButtonTitle = 'Submit'
    /** Check the next values; if one of them is not successful, show 'Next' */
    for (let i = stateKeys.indexOf(firstNotSuccessful) + 1; i < stateKeys.length; i++) {
      const nextValueState = challengeValueStates[stateKeys[i]]
      if (nextValueState !== AuthenticationValueStateType.Success) {
        submitButtonTitle = 'Next'
      }
    }
  }

  return (
    <HeaderHeightContext.Consumer>
      {headerHeight => (
        <StyledKeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={headerHeight}
        >
          <ScrollView keyboardShouldPersistTaps="handled">
            {(challenge.heading || challenge.subheading) && (
              <StyledTableSection>
                <StyledSectionedTableCell>
                  <BaseView>
                    {challenge.heading && <Title>{challenge.heading}</Title>}
                    {challenge.subheading && <Subtitle>{challenge.subheading}</Subtitle>}
                  </BaseView>
                </StyledSectionedTableCell>
              </StyledTableSection>
            )}
            {Object.values(challengeValues).map((challengeValue, index) =>
              renderAuthenticationSource(challengeValue, index),
            )}
            <ButtonCell
              maxHeight={45}
              disabled={singleValidation ? !readyToSubmit || pending : isPending}
              title={submitButtonTitle}
              bold={true}
              onPress={onSubmitPress}
            />
          </ScrollView>
        </StyledKeyboardAvoidingView>
      )}
    </HeaderHeightContext.Consumer>
  )
}
