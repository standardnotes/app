import { useCallback, useEffect, useState } from 'react'

import AccordionItem from '@/Components/Shared/AccordionItem'
import PreferencesGroup from '../../../PreferencesComponents/PreferencesGroup'
import PreferencesSegment from '../../../PreferencesComponents/PreferencesSegment'
import { Subtitle } from '../../../PreferencesComponents/Content'
import DecoratedInput from '@/Components/Input/DecoratedInput'
import Button from '@/Components/Button/Button'
import { HomeServerEnvironmentConfiguration } from '@standardnotes/snjs'
import Dropdown from '@/Components/Dropdown/Dropdown'
import { c } from 'ttag'

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
        <AccordionItem title={c('B6.Preferences.HomeServer.Title').t`Advanced settings`}>
          <div className="flex flex-row items-center">
            <div className="flex max-w-full flex-grow flex-col">
              <PreferencesSegment>
                <Subtitle className={'mt-2'}>{c('B6.Preferences.HomeServer.Subtitle').t`Auth JWT Secret`}</Subtitle>
                <div className={'mt-2'}>
                  <DecoratedInput
                    placeholder={c('B6.Preferences.HomeServer.Placeholder').t`Auth JWT Secret`}
                    defaultValue={homeServerConfiguration?.authJwtSecret}
                    onChange={setAuthJWT}
                  />
                </div>
              </PreferencesSegment>
              <PreferencesSegment>
                <Subtitle className={'mt-2'}>{c('B6.Preferences.HomeServer.Subtitle').t`JWT Secret`}</Subtitle>
                <div className={'mt-2'}>
                  <DecoratedInput
                    placeholder={c('B6.Preferences.HomeServer.Placeholder').t`JWT Secret`}
                    defaultValue={homeServerConfiguration?.jwtSecret}
                    onChange={setJWT}
                  />
                </div>
              </PreferencesSegment>
              <PreferencesSegment>
                <Subtitle className={'mt-2'}>{c('B6.Preferences.HomeServer.Subtitle')
                  .t`Encryption Server Key`}</Subtitle>
                <div className={'mt-2'}>
                  <DecoratedInput
                    placeholder={c('B6.Preferences.HomeServer.Placeholder').t`Encryption Server Key`}
                    defaultValue={homeServerConfiguration?.encryptionServerKey}
                    disabled={true}
                  />
                </div>
              </PreferencesSegment>
              <PreferencesSegment>
                <Subtitle className={'mt-2'}>{c('B6.Preferences.HomeServer.Subtitle').t`Pseudo Params Key`}</Subtitle>
                <div className={'mt-2'}>
                  <DecoratedInput
                    placeholder={c('B6.Preferences.HomeServer.Placeholder').t`Pseudo Params Key`}
                    defaultValue={homeServerConfiguration?.pseudoKeyParamsKey}
                    onChange={setPseudoParamsKey}
                  />
                </div>
              </PreferencesSegment>
              <PreferencesSegment>
                <Subtitle className={'mt-2'}>{c('B6.Preferences.HomeServer.Subtitle').t`Valet Token Secret`}</Subtitle>
                <div className={'mt-2'}>
                  <DecoratedInput
                    placeholder={c('B6.Preferences.HomeServer.Placeholder').t`Valet Token Secret`}
                    defaultValue={homeServerConfiguration?.valetTokenSecret}
                    onChange={setValetTokenSecret}
                  />
                </div>
              </PreferencesSegment>
              <PreferencesSegment>
                <Subtitle className={'mt-2'}>{c('B6.Preferences.HomeServer.Subtitle').t`Port`}</Subtitle>
                <div className="text-xs">{c('B6.Preferences.HomeServer.Info')
                  .t`Changing the port will require you to sign out of all existing sessions.`}</div>
                <div className={'mt-2'}>
                  <DecoratedInput
                    placeholder={c('B6.Preferences.HomeServer.Placeholder').t`Port`}
                    defaultValue={homeServerConfiguration?.port.toString()}
                    onChange={(port: string) => setPort(Number(port))}
                  />
                </div>
              </PreferencesSegment>
              <PreferencesSegment>
                <Subtitle className={'mt-2'}>{c('B6.Preferences.HomeServer.Subtitle').t`Log Level`}</Subtitle>
                <div className={'mt-2'}>
                  <Dropdown
                    label={c('B6.Preferences.HomeServer.Label').t`Log level`}
                    items={[
                      { label: c('B6.Preferences.HomeServer.Label').t`Error`, value: 'error' },
                      { label: c('B6.Preferences.HomeServer.Label').t`Warning`, value: 'warn' },
                      { label: c('B6.Preferences.HomeServer.Label').t`Info`, value: 'info' },
                      { label: c('B6.Preferences.HomeServer.Label').t`Debug`, value: 'debug' },
                    ]}
                    value={selectedLogLevel}
                    onChange={setSelectedLogLevel}
                  />
                </div>
              </PreferencesSegment>
            </div>
          </div>
          {valuesChanged && (
            <Button
              className="mt-3 min-w-20"
              primary
              label={c('B6.Preferences.HomeServer.Action').t`Apply & Restart`}
              onClick={handleConfigurationChange}
            />
          )}
        </AccordionItem>
      </PreferencesSegment>
    </PreferencesGroup>
  )
}

export default EnvironmentConfiguration
