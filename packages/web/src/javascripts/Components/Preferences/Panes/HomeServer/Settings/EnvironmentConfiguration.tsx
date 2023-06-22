import { useCallback, useEffect, useState } from 'react'

import AccordionItem from '@/Components/Shared/AccordionItem'
import PreferencesGroup from '../../../PreferencesComponents/PreferencesGroup'
import PreferencesSegment from '../../../PreferencesComponents/PreferencesSegment'
import { Subtitle } from '../../../PreferencesComponents/Content'
import DecoratedInput from '@/Components/Input/DecoratedInput'
import Button from '@/Components/Button/Button'
import { HomeServerEnvironmentConfiguration } from '@standardnotes/snjs'
import Dropdown from '@/Components/Dropdown/Dropdown'

type Props = {
  homeServerConfiguration: HomeServerEnvironmentConfiguration
  setHomeServerConfigurationChangedCallback: (homeServerConfiguration: HomeServerEnvironmentConfiguration) => void
}

const EnvironmentConfiguration = ({ setHomeServerConfigurationChangedCallback, homeServerConfiguration }: Props) => {
  const [authJWT, setAuthJWT] = useState(homeServerConfiguration.authJwtSecret)
  const [jwt, setJWT] = useState(homeServerConfiguration.jwtSecret)
  const [pseudoParamsKey, setPseudoParamsKey] = useState(homeServerConfiguration.pseudoKeyParamsKey)
  const [valetTokenSecret, setValetTokenSecret] = useState(homeServerConfiguration.valetTokenSecret)
  const [port, setPort] = useState(homeServerConfiguration.port)

  const [valuesChanged, setValuesChanged] = useState(false)
  const [selectedLogLevel, setSelectedLogLevel] = useState(homeServerConfiguration.logLevel as string)

  useEffect(() => {
    const anyOfTheValuesHaveChanged =
      homeServerConfiguration.authJwtSecret !== authJWT ||
      homeServerConfiguration.jwtSecret !== jwt ||
      homeServerConfiguration.pseudoKeyParamsKey !== pseudoParamsKey ||
      homeServerConfiguration.valetTokenSecret !== valetTokenSecret ||
      homeServerConfiguration.port !== port ||
      homeServerConfiguration.logLevel !== selectedLogLevel

    setValuesChanged(anyOfTheValuesHaveChanged)
  }, [
    homeServerConfiguration,
    selectedLogLevel,
    authJWT,
    jwt,
    pseudoParamsKey,
    valetTokenSecret,
    port,
    setValuesChanged,
  ])

  const handleConfigurationChange = useCallback(async () => {
    homeServerConfiguration.authJwtSecret = authJWT
    homeServerConfiguration.jwtSecret = jwt
    homeServerConfiguration.pseudoKeyParamsKey = pseudoParamsKey
    homeServerConfiguration.valetTokenSecret = valetTokenSecret
    homeServerConfiguration.port = port
    homeServerConfiguration.logLevel = selectedLogLevel ?? homeServerConfiguration.logLevel

    setHomeServerConfigurationChangedCallback(homeServerConfiguration)

    setValuesChanged(false)
  }, [
    setHomeServerConfigurationChangedCallback,
    homeServerConfiguration,
    selectedLogLevel,
    authJWT,
    jwt,
    pseudoParamsKey,
    valetTokenSecret,
    port,
  ])

  return (
    <PreferencesGroup>
      <PreferencesSegment>
        <AccordionItem title={'Advanced settings'}>
          <div className="flex flex-row items-center">
            <div className="flex max-w-full flex-grow flex-col">
              <PreferencesSegment>
                <Subtitle className={'mt-2'}>Auth JWT Secret</Subtitle>
                <div className={'mt-2'}>
                  <DecoratedInput
                    placeholder={'Auth JWT Secret'}
                    defaultValue={homeServerConfiguration?.authJwtSecret}
                    onChange={setAuthJWT}
                  />
                </div>
              </PreferencesSegment>
              <PreferencesSegment>
                <Subtitle className={'mt-2'}>JWT Secret</Subtitle>
                <div className={'mt-2'}>
                  <DecoratedInput
                    placeholder={'JWT Secret'}
                    defaultValue={homeServerConfiguration?.jwtSecret}
                    onChange={setJWT}
                  />
                </div>
              </PreferencesSegment>
              <PreferencesSegment>
                <Subtitle className={'mt-2'}>Encryption Server Key</Subtitle>
                <div className={'mt-2'}>
                  <DecoratedInput
                    placeholder={'Encryption Server Key'}
                    defaultValue={homeServerConfiguration?.encryptionServerKey}
                    disabled={true}
                  />
                </div>
              </PreferencesSegment>
              <PreferencesSegment>
                <Subtitle className={'mt-2'}>Pseudo Params Key</Subtitle>
                <div className={'mt-2'}>
                  <DecoratedInput
                    placeholder={'Pseudo Params Key'}
                    defaultValue={homeServerConfiguration?.pseudoKeyParamsKey}
                    onChange={setPseudoParamsKey}
                  />
                </div>
              </PreferencesSegment>
              <PreferencesSegment>
                <Subtitle className={'mt-2'}>Valet Token Secret</Subtitle>
                <div className={'mt-2'}>
                  <DecoratedInput
                    placeholder={'Valet Token Secret'}
                    defaultValue={homeServerConfiguration?.valetTokenSecret}
                    onChange={setValetTokenSecret}
                  />
                </div>
              </PreferencesSegment>
              <PreferencesSegment>
                <Subtitle className={'mt-2'}>Port</Subtitle>
                <div className="text-xs">Changing the port will require you to sign out of all existing sessions.</div>
                <div className={'mt-2'}>
                  <DecoratedInput
                    placeholder={'Port'}
                    defaultValue={homeServerConfiguration?.port.toString()}
                    onChange={(port: string) => setPort(Number(port))}
                  />
                </div>
              </PreferencesSegment>
              <PreferencesSegment>
                <Subtitle className={'mt-2'}>Log Level</Subtitle>
                <div className={'mt-2'}>
                  <Dropdown
                    label="Log level"
                    items={[
                      { label: 'Error', value: 'error' },
                      { label: 'Warning', value: 'warn' },
                      { label: 'Info', value: 'info' },
                      { label: 'Debug', value: 'debug' },
                    ]}
                    value={selectedLogLevel}
                    onChange={setSelectedLogLevel}
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
