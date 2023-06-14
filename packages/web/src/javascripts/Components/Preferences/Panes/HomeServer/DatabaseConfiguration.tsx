import { useCallback, useEffect, useRef, useState } from 'react'
import { HomeServerEnvironmentConfiguration } from '@standardnotes/snjs'

import AccordionItem from '@/Components/Shared/AccordionItem'
import PreferencesGroup from '../../PreferencesComponents/PreferencesGroup'
import PreferencesSegment from '../../PreferencesComponents/PreferencesSegment'
import { useApplication } from '@/Components/ApplicationProvider'
import Button from '@/Components/Button/Button'
import Dropdown from '@/Components/Dropdown/Dropdown'
import { Subtitle } from '../../PreferencesComponents/Content'
import DecoratedInput from '@/Components/Input/DecoratedInput'
import { Status } from '@/Components/StatusIndicator/Status'

type Props = {
  setServerStatusCallback: (status: Status) => void
}

const DatabaseConfiguration = ({ setServerStatusCallback }: Props) => {
  const application = useApplication()
  const homeServerService = application.homeServer

  const [valuesChanged, setValuesChanged] = useState(false)
  const [isMySQLSelected, setIsMySQLSelected] = useState(false)
  const [selectedDatabaseEngine, setSelectedDatabaseEngine] = useState('')
  const [homeServerConfiguration, setHomeServerConfiguration] = useState<HomeServerEnvironmentConfiguration | null>(
    null,
  )

  const mysqlUsernameInputRef = useRef<HTMLInputElement>(null)
  const mysqlPasswordInputRef = useRef<HTMLInputElement>(null)
  const mysqlHostInputRef = useRef<HTMLInputElement>(null)
  const mysqlPortInputRef = useRef<HTMLInputElement>(null)
  const mysqlDatabaseInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const homeServerConfiguration = homeServerService.getHomeServerConfiguration()
    if (!homeServerConfiguration) {
      return
    }
    setHomeServerConfiguration(homeServerConfiguration)

    if (selectedDatabaseEngine === '') {
      setSelectedDatabaseEngine(homeServerConfiguration.databaseEngine)
    }
    setIsMySQLSelected(selectedDatabaseEngine === 'mysql')
  }, [homeServerService, selectedDatabaseEngine])

  const checkValues = useCallback(() => {
    if (!homeServerConfiguration) {
      return
    }

    let mysqlConfigurationChanged = false
    if (selectedDatabaseEngine === 'mysql') {
      const allMysqlInputsFilled =
        !!mysqlUsernameInputRef.current?.value &&
        !!mysqlPasswordInputRef.current?.value &&
        !!mysqlHostInputRef.current?.value &&
        !!mysqlPortInputRef.current?.value &&
        !!mysqlDatabaseInputRef.current?.value

      mysqlConfigurationChanged =
        allMysqlInputsFilled &&
        (homeServerConfiguration.mysqlConfiguration?.username !== mysqlUsernameInputRef.current?.value ||
          homeServerConfiguration.mysqlConfiguration?.password !== mysqlPasswordInputRef.current?.value ||
          homeServerConfiguration.mysqlConfiguration?.host !== mysqlHostInputRef.current?.value ||
          homeServerConfiguration.mysqlConfiguration?.port !== Number(mysqlPortInputRef.current?.value) ||
          homeServerConfiguration.mysqlConfiguration?.database !== mysqlDatabaseInputRef.current?.value)
    }

    setValuesChanged(mysqlConfigurationChanged)
  }, [selectedDatabaseEngine, homeServerConfiguration])

  const handleConfigurationChange = useCallback(async () => {
    try {
      setServerStatusCallback({ type: 'saving', message: 'Applying changes & restarting...' })

      if (!homeServerConfiguration) {
        setServerStatusCallback({ type: 'error', message: 'Home server configuration not found' })

        return
      }

      homeServerConfiguration.databaseEngine = selectedDatabaseEngine as 'sqlite' | 'mysql'
      if (selectedDatabaseEngine === 'mysql') {
        homeServerConfiguration.mysqlConfiguration = {
          username: mysqlUsernameInputRef.current?.value ?? '',
          password: mysqlPasswordInputRef.current?.value ?? '',
          host: mysqlHostInputRef.current?.value ?? '',
          port: mysqlPortInputRef.current?.value ? +mysqlPortInputRef.current?.value : 3306,
          database: mysqlDatabaseInputRef.current?.value ?? '',
        }
      }

      setHomeServerConfiguration(homeServerConfiguration)

      await homeServerService.stopHomeServer()

      await homeServerService.setHomeServerConfiguration(homeServerConfiguration)

      const result = await homeServerService.startHomeServer()
      if (result !== undefined) {
        setServerStatusCallback({ type: 'error', message: result })

        return
      }

      setValuesChanged(false)

      setServerStatusCallback({ type: 'saved', message: 'Online' })
    } catch (error) {
      setServerStatusCallback({ type: 'error', message: (error as Error).message })
    }
  }, [homeServerConfiguration, homeServerService, selectedDatabaseEngine, setServerStatusCallback])

  const handleDatabaseEngineChange = useCallback(
    (engine: string) => {
      if (!homeServerConfiguration) {
        return
      }

      setIsMySQLSelected(engine === 'mysql')
      setSelectedDatabaseEngine(engine)
      setValuesChanged(homeServerConfiguration.databaseEngine !== engine)
    },
    [homeServerConfiguration],
  )

  return (
    <PreferencesGroup>
      <PreferencesSegment>
        <AccordionItem title={'Database'}>
          <div className="flex flex-row items-center">
            <div className="flex max-w-full flex-grow flex-col">
              <Dropdown
                label="Database engine"
                items={[
                  { label: 'SQLite', value: 'sqlite' },
                  { label: 'MySQL', value: 'mysql' },
                ]}
                value={selectedDatabaseEngine}
                onChange={handleDatabaseEngineChange}
              />
              {isMySQLSelected && (
                <>
                  <PreferencesSegment>
                    <Subtitle>Database Username</Subtitle>
                    <div className={'mt-2'}>
                      <DecoratedInput
                        placeholder={'username'}
                        defaultValue={homeServerConfiguration?.mysqlConfiguration?.username}
                        ref={mysqlUsernameInputRef}
                        onChange={checkValues}
                      />
                    </div>
                  </PreferencesSegment>
                  <PreferencesSegment>
                    <Subtitle>Database Password</Subtitle>
                    <div className={'mt-2'}>
                      <DecoratedInput
                        placeholder={'password'}
                        defaultValue={homeServerConfiguration?.mysqlConfiguration?.password}
                        ref={mysqlPasswordInputRef}
                        onChange={checkValues}
                      />
                    </div>
                  </PreferencesSegment>
                  <PreferencesSegment>
                    <Subtitle>Database Host</Subtitle>
                    <div className={'mt-2'}>
                      <DecoratedInput
                        placeholder={'host'}
                        defaultValue={homeServerConfiguration?.mysqlConfiguration?.host}
                        ref={mysqlHostInputRef}
                        onChange={checkValues}
                      />
                    </div>
                  </PreferencesSegment>
                  <PreferencesSegment>
                    <Subtitle>Database Port</Subtitle>
                    <div className={'mt-2'}>
                      <DecoratedInput
                        placeholder={'port'}
                        defaultValue={
                          homeServerConfiguration?.mysqlConfiguration?.port
                            ? homeServerConfiguration?.mysqlConfiguration?.port.toString()
                            : ''
                        }
                        ref={mysqlPortInputRef}
                        onChange={checkValues}
                      />
                    </div>
                  </PreferencesSegment>
                  <PreferencesSegment>
                    <Subtitle>Database Name</Subtitle>
                    <div className={'mt-2'}>
                      <DecoratedInput
                        placeholder={'name'}
                        defaultValue={homeServerConfiguration?.mysqlConfiguration?.database}
                        ref={mysqlDatabaseInputRef}
                        onChange={checkValues}
                      />
                    </div>
                  </PreferencesSegment>
                </>
              )}
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

export default DatabaseConfiguration
