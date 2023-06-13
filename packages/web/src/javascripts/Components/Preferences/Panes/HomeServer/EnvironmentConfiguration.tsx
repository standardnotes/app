import AccordionItem from '@/Components/Shared/AccordionItem'

import PreferencesGroup from '../../PreferencesComponents/PreferencesGroup'
import PreferencesSegment from '../../PreferencesComponents/PreferencesSegment'
import { useApplication } from '@/Components/ApplicationProvider'
import { Subtitle } from '../../PreferencesComponents/Content'
import DecoratedInput from '@/Components/Input/DecoratedInput'
import Button from '@/Components/Button/Button'
import { useCallback, useRef, useState } from 'react'

type Props = {
  setErrorMessageCallback: (message: string) => void
}

const EnvironmentConfiguration = ({ setErrorMessageCallback }: Props) => {
  const application = useApplication()
  const homeServerService = application.homeServer

  const homeServerConfiguration = homeServerService.getHomeServerConfiguration()
  const authJWTInputRef = useRef<HTMLInputElement>(null)
  const jwtInputRef = useRef<HTMLInputElement>(null)
  const encryptionServerKeyInputRef = useRef<HTMLInputElement>(null)
  const pseudoParamsKeyInputRef = useRef<HTMLInputElement>(null)
  const valetTokenSecretInputRef = useRef<HTMLInputElement>(null)
  const portInputRef = useRef<HTMLInputElement>(null)
  const logLevelInputRef = useRef<HTMLInputElement>(null)

  const [valuesChanged, setValuesChanged] = useState(false)

  const checkValues = useCallback(() => {
    if (!homeServerConfiguration) {
      return
    }

    const anyOfTheValuesHaveChanged =
      homeServerConfiguration.authJwtSecret !== authJWTInputRef.current?.value ||
      homeServerConfiguration.jwtSecret !== jwtInputRef.current?.value ||
      homeServerConfiguration.encryptionServerKey !== encryptionServerKeyInputRef.current?.value ||
      homeServerConfiguration.pseudoKeyParamsKey !== pseudoParamsKeyInputRef.current?.value ||
      homeServerConfiguration.valetTokenSecret !== valetTokenSecretInputRef.current?.value ||
      homeServerConfiguration.port !==
        parseInt(portInputRef.current?.value || homeServerConfiguration.port.toString()) ||
      homeServerConfiguration.logLevel !== logLevelInputRef.current?.value

    setValuesChanged(anyOfTheValuesHaveChanged)
  }, [homeServerConfiguration])

  const handleConfigurationChange = useCallback(async () => {
    try {
      if (!homeServerConfiguration) {
        setErrorMessageCallback('Home server configuration not found')

        return
      }

      homeServerConfiguration.authJwtSecret = authJWTInputRef.current?.value || homeServerConfiguration.authJwtSecret
      homeServerConfiguration.jwtSecret = jwtInputRef.current?.value || homeServerConfiguration.jwtSecret
      homeServerConfiguration.encryptionServerKey =
        encryptionServerKeyInputRef.current?.value || homeServerConfiguration.encryptionServerKey
      homeServerConfiguration.pseudoKeyParamsKey =
        pseudoParamsKeyInputRef.current?.value || homeServerConfiguration.pseudoKeyParamsKey
      homeServerConfiguration.valetTokenSecret =
        valetTokenSecretInputRef.current?.value || homeServerConfiguration.valetTokenSecret
      homeServerConfiguration.port = parseInt(portInputRef.current?.value || homeServerConfiguration.port.toString())
      homeServerConfiguration.logLevel = logLevelInputRef.current?.value || homeServerConfiguration.logLevel

      await homeServerService.setHomeServerConfiguration(homeServerConfiguration)

      const result = await homeServerService.restartHomeServer()
      if (result !== undefined) {
        setErrorMessageCallback(result)

        return
      }

      setValuesChanged(false)
    } catch (error) {
      setErrorMessageCallback((error as Error).message)
    }
  }, [homeServerConfiguration, homeServerService, setErrorMessageCallback])

  return (
    <PreferencesGroup>
      <PreferencesSegment>
        <AccordionItem title={'Advanced settings'}>
          <div className="flex flex-row items-center">
            <div className="flex max-w-full flex-grow flex-col">
              <PreferencesSegment>
                <Subtitle>Auth JWT Secret</Subtitle>
                <div className={'mt-2'}>
                  <DecoratedInput
                    placeholder={'Auth JWT Secret'}
                    defaultValue={homeServerConfiguration?.authJwtSecret}
                    ref={authJWTInputRef}
                    onChange={checkValues}
                  />
                </div>
              </PreferencesSegment>
              <PreferencesSegment>
                <Subtitle>JWT Secret</Subtitle>
                <div className={'mt-2'}>
                  <DecoratedInput
                    placeholder={'JWT Secret'}
                    defaultValue={homeServerConfiguration?.jwtSecret}
                    ref={jwtInputRef}
                    onChange={checkValues}
                  />
                </div>
              </PreferencesSegment>
              <PreferencesSegment>
                <Subtitle>Encryption Server Key</Subtitle>
                <div className={'mt-2'}>
                  <DecoratedInput
                    placeholder={'Encryption Server Key'}
                    defaultValue={homeServerConfiguration?.encryptionServerKey}
                    ref={encryptionServerKeyInputRef}
                    onChange={checkValues}
                  />
                </div>
              </PreferencesSegment>
              <PreferencesSegment>
                <Subtitle>Pseudo Params Key</Subtitle>
                <div className={'mt-2'}>
                  <DecoratedInput
                    placeholder={'Pseudo Params Key'}
                    defaultValue={homeServerConfiguration?.pseudoKeyParamsKey}
                    ref={pseudoParamsKeyInputRef}
                    onChange={checkValues}
                  />
                </div>
              </PreferencesSegment>
              <PreferencesSegment>
                <Subtitle>Valet Token Secret</Subtitle>
                <div className={'mt-2'}>
                  <DecoratedInput
                    placeholder={'Valet Token Secret'}
                    defaultValue={homeServerConfiguration?.valetTokenSecret}
                    ref={valetTokenSecretInputRef}
                    onChange={checkValues}
                  />
                </div>
              </PreferencesSegment>
              <PreferencesSegment>
                <Subtitle>Port</Subtitle>
                <div className={'mt-2'}>
                  <DecoratedInput
                    placeholder={'Port'}
                    defaultValue={homeServerConfiguration?.port.toString()}
                    ref={portInputRef}
                    onChange={checkValues}
                  />
                </div>
              </PreferencesSegment>
              <PreferencesSegment>
                <Subtitle>Log Level</Subtitle>
                <div className={'mt-2'}>
                  <DecoratedInput
                    placeholder={'Log Level'}
                    defaultValue={homeServerConfiguration?.logLevel}
                    ref={logLevelInputRef}
                    onChange={checkValues}
                  />
                </div>
              </PreferencesSegment>
            </div>
          </div>
          {valuesChanged && (
            <Button className="mt-3 min-w-20" primary label="Apply & Restart" onClick={handleConfigurationChange} />
          )}
        </AccordionItem>
      </PreferencesSegment>
    </PreferencesGroup>
  )
}

export default EnvironmentConfiguration
