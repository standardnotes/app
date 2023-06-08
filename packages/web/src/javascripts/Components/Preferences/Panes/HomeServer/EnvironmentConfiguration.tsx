import AccordionItem from '@/Components/Shared/AccordionItem'

import PreferencesGroup from '../../PreferencesComponents/PreferencesGroup'
import PreferencesSegment from '../../PreferencesComponents/PreferencesSegment'
import { useApplication } from '@/Components/ApplicationProvider'
import { Subtitle } from '../../PreferencesComponents/Content'
import DecoratedInput from '@/Components/Input/DecoratedInput'
import Button from '@/Components/Button/Button'
import { useRef } from 'react'

const EnvironmentConfiguration = () => {
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

  const handleConfigurationChange = () => {
    if (!homeServerConfiguration) {
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

    homeServerService.setHomeServerConfiguration(homeServerConfiguration)

    homeServerService.restartHomeServer()
  }

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
                  />
                </div>
              </PreferencesSegment>
            </div>
          </div>
          <Button className="mt-3 min-w-20" primary label="Apply & Restart" onClick={handleConfigurationChange} />
        </AccordionItem>
      </PreferencesSegment>
    </PreferencesGroup>
  )
}

export default EnvironmentConfiguration
