import { useCallback, useEffect, useState } from 'react'
import { HomeServerEnvironmentConfiguration } from '@standardnotes/snjs'

import AccordionItem from '@/Components/Shared/AccordionItem'
import PreferencesGroup from '../../../PreferencesComponents/PreferencesGroup'
import PreferencesSegment from '../../../PreferencesComponents/PreferencesSegment'
import Button from '@/Components/Button/Button'
import { Subtitle } from '../../../PreferencesComponents/Content'
import DecoratedInput from '@/Components/Input/DecoratedInput'
import RadioButtonGroup from '@/Components/RadioButtonGroup/RadioButtonGroup'
import HorizontalSeparator from '@/Components/Shared/HorizontalSeparator'

type Props = {
  homeServerConfiguration: HomeServerEnvironmentConfiguration
  setHomeServerConfigurationChangedCallback: (homeServerConfiguration: HomeServerEnvironmentConfiguration) => void
}

const DatabaseConfiguration = ({ setHomeServerConfigurationChangedCallback, homeServerConfiguration }: Props) => {
  const [valuesChanged, setValuesChanged] = useState(false)
  const [selectedDatabaseEngine, setSelectedDatabaseEngine] = useState<string>(homeServerConfiguration.databaseEngine)
  const [isMySQLSelected, setIsMySQLSelected] = useState(homeServerConfiguration.databaseEngine === 'mysql')
  const [mysqlDatabase, setMysqlDatabase] = useState(homeServerConfiguration.mysqlConfiguration?.database || '')
  const [mysqlHost, setMysqlHost] = useState(homeServerConfiguration.mysqlConfiguration?.host || '')
  const [mysqlPassword, setMysqlPassword] = useState(homeServerConfiguration.mysqlConfiguration?.password || '')
  const [mysqlPort, setMysqlPort] = useState(homeServerConfiguration.mysqlConfiguration?.port || 3306)
  const [mysqlUsername, setMysqlUsername] = useState(homeServerConfiguration.mysqlConfiguration?.username || '')

  useEffect(() => {
    const databaseEngineChanged = homeServerConfiguration.databaseEngine !== selectedDatabaseEngine

    setIsMySQLSelected(selectedDatabaseEngine === 'mysql')

    let mysqlConfigurationChanged = false
    if (selectedDatabaseEngine === 'mysql') {
      const allMysqlInputsFilled = !!mysqlDatabase && !!mysqlHost && !!mysqlPassword && !!mysqlPort && !!mysqlUsername

      mysqlConfigurationChanged =
        allMysqlInputsFilled &&
        (homeServerConfiguration.mysqlConfiguration?.username !== mysqlUsername ||
          homeServerConfiguration.mysqlConfiguration?.password !== mysqlPassword ||
          homeServerConfiguration.mysqlConfiguration?.host !== mysqlHost ||
          homeServerConfiguration.mysqlConfiguration?.port !== mysqlPort ||
          homeServerConfiguration.mysqlConfiguration?.database !== mysqlDatabase)

      setValuesChanged(mysqlConfigurationChanged || databaseEngineChanged)

      return
    }

    setValuesChanged(databaseEngineChanged)
  }, [
    homeServerConfiguration,
    selectedDatabaseEngine,
    mysqlDatabase,
    mysqlHost,
    mysqlPassword,
    mysqlPort,
    mysqlUsername,
  ])

  const handleConfigurationChange = useCallback(async () => {
    homeServerConfiguration.databaseEngine = selectedDatabaseEngine as 'sqlite' | 'mysql'
    if (selectedDatabaseEngine === 'mysql') {
      homeServerConfiguration.mysqlConfiguration = {
        username: mysqlUsername,
        password: mysqlPassword,
        host: mysqlHost,
        port: mysqlPort,
        database: mysqlDatabase,
      }
    }

    setHomeServerConfigurationChangedCallback(homeServerConfiguration)

    setValuesChanged(false)
  }, [
    homeServerConfiguration,
    selectedDatabaseEngine,
    setHomeServerConfigurationChangedCallback,
    mysqlUsername,
    mysqlPassword,
    mysqlHost,
    mysqlPort,
    mysqlDatabase,
  ])

  return (
    <PreferencesGroup>
      <PreferencesSegment>
        <AccordionItem title={'Database'}>
          <div className="flex flex-row items-center">
            <div className="flex max-w-full flex-grow flex-col">
              <RadioButtonGroup
                items={[
                  { label: 'SQLite', value: 'sqlite' },
                  { label: 'MySQL', value: 'mysql' },
                ]}
                value={selectedDatabaseEngine}
                onChange={setSelectedDatabaseEngine}
              />
              {isMySQLSelected && (
                <>
                  <div className={'mt-2'}>
                    In order to connect to a MySQL database, ensure that your system has MySQL installed. For detailed
                    instructions, visit the{' '}
                    <a className="text-info" href="https://dev.mysql.com/doc/mysql-installation-excerpt/8.0/en/">
                      MySQL website.
                    </a>
                  </div>
                  <HorizontalSeparator classes="my-4" />
                  <PreferencesSegment>
                    <Subtitle className={'mt-2'}>Database Username</Subtitle>
                    <div className={'mt-2'}>
                      <DecoratedInput
                        placeholder={'username'}
                        defaultValue={homeServerConfiguration?.mysqlConfiguration?.username}
                        onChange={setMysqlUsername}
                      />
                    </div>
                  </PreferencesSegment>
                  <PreferencesSegment>
                    <Subtitle className={'mt-2'}>Database Password</Subtitle>
                    <div className={'mt-2'}>
                      <DecoratedInput
                        placeholder={'password'}
                        defaultValue={homeServerConfiguration?.mysqlConfiguration?.password}
                        onChange={setMysqlPassword}
                        type="password"
                      />
                    </div>
                  </PreferencesSegment>
                  <PreferencesSegment>
                    <Subtitle className={'mt-2'}>Database Host</Subtitle>
                    <div className={'mt-2'}>
                      <DecoratedInput
                        placeholder={'host'}
                        defaultValue={homeServerConfiguration?.mysqlConfiguration?.host}
                        onChange={setMysqlHost}
                      />
                    </div>
                  </PreferencesSegment>
                  <PreferencesSegment>
                    <Subtitle className={'mt-2'}>Database Port</Subtitle>
                    <div className={'mt-2'}>
                      <DecoratedInput
                        placeholder={'port'}
                        defaultValue={
                          homeServerConfiguration?.mysqlConfiguration?.port
                            ? homeServerConfiguration?.mysqlConfiguration?.port.toString()
                            : ''
                        }
                        onChange={(port: string) => setMysqlPort(Number(port))}
                      />
                    </div>
                  </PreferencesSegment>
                  <PreferencesSegment>
                    <Subtitle className={'mt-2'}>Database Name</Subtitle>
                    <div className={'mt-2'}>
                      <DecoratedInput
                        placeholder={'name'}
                        defaultValue={homeServerConfiguration?.mysqlConfiguration?.database}
                        onChange={setMysqlDatabase}
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
