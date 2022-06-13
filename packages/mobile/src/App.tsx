import { ToastWrapper } from '@Components/ToastWrapper'
import { ActionSheetProvider } from '@expo/react-native-action-sheet'
import { MobileApplication } from '@Lib/Application'
import { ApplicationGroup } from '@Lib/ApplicationGroup'
import { navigationRef } from '@Lib/NavigationService'
import { DefaultTheme, NavigationContainer } from '@react-navigation/native'
import { ApplicationGroupContext } from '@Root/ApplicationGroupContext'
import { MobileThemeVariables } from '@Root/Style/Themes/styled-components'
import { ApplicationGroupEvent, DeinitMode, DeinitSource } from '@standardnotes/snjs'
import { ThemeService, ThemeServiceContext } from '@Style/ThemeService'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { StatusBar } from 'react-native'
import { ThemeProvider } from 'styled-components/native'
import { ApplicationContext } from './ApplicationContext'
import { MainStackComponent } from './ModalStack'

export type HeaderTitleParams = {
  title?: string
  subTitle?: string
  subTitleColor?: string
}

export type TEnvironment = 'prod' | 'dev'

const AppComponent: React.FC<{
  application: MobileApplication
  env: TEnvironment
}> = ({ application, env }) => {
  const themeService = useRef<ThemeService>()
  const appReady = useRef(false)
  const navigationReady = useRef(false)
  const [activeTheme, setActiveTheme] = useState<MobileThemeVariables | undefined>()

  const setThemeServiceRef = useCallback((node: ThemeService | undefined) => {
    if (node) {
      node.addThemeChangeObserver(() => {
        setActiveTheme(node.variables)
      })
    }

    /**
     * We check if both application and navigation are ready and launch application afterwads
     */
    themeService.current = node
  }, [])

  /**
   * We check if both application and navigation are ready and launch application afterwads
   */
  const launchApp = useCallback(
    (setAppReady: boolean, setNavigationReady: boolean) => {
      if (setAppReady) {
        appReady.current = true
      }
      if (setNavigationReady) {
        navigationReady.current = true
      }
      if (navigationReady.current && appReady.current) {
        void application.launch()
      }
    },
    [application],
  )

  useEffect(() => {
    let themeServiceInstance: ThemeService
    const loadApplication = async () => {
      themeServiceInstance = new ThemeService(application)
      setThemeServiceRef(themeServiceInstance)

      await application.prepareForLaunch({
        receiveChallenge: async challenge => {
          application.promptForChallenge(challenge)
        },
      })

      await themeServiceInstance.init()
      launchApp(true, false)
    }

    void loadApplication()

    return () => {
      themeServiceInstance?.deinit()
      setThemeServiceRef(undefined)

      if (!application.hasStartedDeinit()) {
        application.deinit(DeinitMode.Soft, DeinitSource.Lock)
      }
    }
  }, [application, application.Uuid, env, launchApp, setThemeServiceRef])

  if (!themeService.current || !activeTheme) {
    return null
  }

  return (
    <NavigationContainer
      onReady={() => launchApp(false, true)}
      theme={{
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          background: activeTheme.stylekitBackgroundColor,
          border: activeTheme.stylekitBorderColor,
        },
      }}
      ref={navigationRef}
    >
      <StatusBar translucent />
      {themeService.current && (
        <>
          <ThemeProvider theme={activeTheme}>
            <ActionSheetProvider>
              <ThemeServiceContext.Provider value={themeService.current}>
                <MainStackComponent env={env} />
              </ThemeServiceContext.Provider>
            </ActionSheetProvider>
            <ToastWrapper />
          </ThemeProvider>
        </>
      )}
    </NavigationContainer>
  )
}

export const App = (props: { env: TEnvironment }) => {
  const [application, setApplication] = useState<MobileApplication | undefined>()

  const createNewAppGroup = useCallback(() => {
    const group = new ApplicationGroup()
    void group.initialize()
    return group
  }, [])

  const [appGroup, setAppGroup] = useState<ApplicationGroup>(() => createNewAppGroup())

  useEffect(() => {
    const removeAppChangeObserver = appGroup.addEventObserver(event => {
      if (event === ApplicationGroupEvent.PrimaryApplicationSet) {
        const mobileApplication = appGroup.primaryApplication as MobileApplication
        setApplication(mobileApplication)
      } else if (event === ApplicationGroupEvent.DeviceWillRestart) {
        setApplication(undefined)
        setAppGroup(createNewAppGroup())
      }
    })
    return removeAppChangeObserver
  }, [appGroup, appGroup.primaryApplication, createNewAppGroup])

  if (!application) {
    return null
  }

  return (
    <ApplicationGroupContext.Provider value={appGroup}>
      <ApplicationContext.Provider value={application}>
        <AppComponent env={props.env} key={application.Uuid} application={application} />
      </ApplicationContext.Provider>
    </ApplicationGroupContext.Provider>
  )
}
