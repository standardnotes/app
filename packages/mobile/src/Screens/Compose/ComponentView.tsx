import { ComponentLoadingError } from '@Lib/ComponentManager'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import { ApplicationContext } from '@Root/ApplicationContext'
import { AppStackNavigationProp } from '@Root/AppStack'
import { SCREEN_NOTES } from '@Root/Screens/screens'
import { ButtonType, ComponentViewer, PrefKey } from '@standardnotes/snjs'
import { ThemeServiceContext } from '@Style/ThemeService'
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react'
import { Platform } from 'react-native'
import { WebView } from 'react-native-webview'
import {
  OnShouldStartLoadWithRequest,
  WebViewErrorEvent,
  WebViewMessageEvent,
} from 'react-native-webview/lib/WebViewTypes'
import {
  DeprecatedContainer,
  DeprecatedIcon,
  DeprecatedText,
  FlexContainer,
  LockedContainer,
  LockedText,
  StyledIcon,
  StyledWebview,
} from './ComponentView.styled'

type Props = {
  componentViewer: ComponentViewer
  onLoadEnd: () => void
  onLoadStart: () => void
  onLoadError: (error: ComponentLoadingError, desc?: string) => void
  onDownloadEditorStart: () => void
  onDownloadEditorEnd: () => void
}

const log = (message?: any, ...optionalParams: any[]) => {
  const LOGGING_ENABLED = false
  if (LOGGING_ENABLED) {
    console.log(message, optionalParams, '\n\n')
    console.log('\n\n')
  }
}

/** On Android, webview.onShouldStartLoadWithRequest is not called by react-native-webview*/
const SupportsShouldLoadRequestHandler = Platform.OS === 'ios'

export const ComponentView = ({
  onLoadEnd,
  onLoadError,
  onLoadStart,
  onDownloadEditorStart,
  onDownloadEditorEnd,
  componentViewer,
}: Props) => {
  // Context
  const application = useContext(ApplicationContext)
  const themeService = useContext(ThemeServiceContext)

  // State
  const [showWebView, setShowWebView] = useState<boolean>(true)
  const [requiresLocalEditor, setRequiresLocalEditor] = useState<boolean>(false)
  const [localEditorReady, setLocalEditorReady] = useState<boolean>(false)

  // Ref
  const didLoadRootUrl = useRef<boolean>(false)
  const webViewRef = useRef<WebView>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const navigation = useNavigation<AppStackNavigationProp<typeof SCREEN_NOTES>['navigation']>()

  useEffect(() => {
    const removeBlurScreenListener = navigation.addListener('blur', () => {
      setShowWebView(false)
    })

    return removeBlurScreenListener
  }, [navigation])

  useFocusEffect(() => {
    setShowWebView(true)
  })

  useEffect(() => {
    const warnIfUnsupportedEditors = async () => {
      let platformVersionRequirements

      switch (Platform.OS) {
        case 'ios':
          if (parseInt(Platform.Version.toString(), 10) < 11) {
            // WKWebView has issues on iOS < 11
            platformVersionRequirements = 'iOS 11 or greater'
          }
          break
        case 'android':
          if (Platform.Version <= 23) {
            /**
             * postMessage doesn't work on Android <= 6 (API version 23)
             * https://github.com/facebook/react-native/issues/11594
             */
            platformVersionRequirements = 'Android 7.0 or greater'
          }
          break
      }

      if (!platformVersionRequirements) {
        return
      }

      const doNotShowAgainUnsupportedEditors = application
        ?.getLocalPreferences()
        .getValue(PrefKey.MobileDoNotShowAgainUnsupportedEditors, false)

      if (!doNotShowAgainUnsupportedEditors) {
        const alertText =
          `Web editors require ${platformVersionRequirements}. ` +
          'Your version does not support web editors. ' +
          'Changes you make may not be properly saved. Please switch to the Plain Editor for the best experience.'

        const confirmed = await application?.alertService?.confirm(
          alertText,
          'Editors Not Supported',
          "Don't show again",
          ButtonType.Info,
          'OK',
        )

        if (confirmed) {
          void application?.getLocalPreferences().setUserPrefValue(PrefKey.MobileDoNotShowAgainUnsupportedEditors, true)
        }
      }
    }

    void warnIfUnsupportedEditors()
  }, [application])

  const onLoadErrorHandler = useCallback(
    (error?: WebViewErrorEvent) => {
      log('On load error', error)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      onLoadError(ComponentLoadingError.Unknown, error?.nativeEvent?.description)
    },
    [onLoadError, timeoutRef],
  )

  useEffect(() => {
    const componentManager = application!.mobileComponentManager
    const component = componentViewer.component
    const isDownloadable = componentManager.isComponentDownloadable(component)
    setRequiresLocalEditor(isDownloadable)

    if (isDownloadable) {
      const asyncFunc = async () => {
        if (await componentManager.doesComponentNeedDownload(component)) {
          onDownloadEditorStart()
          const error = await componentManager.downloadComponentOffline(component)
          log('Download component error', error)
          onDownloadEditorEnd()
          if (error) {
            onLoadError(error)
          }
        }
        setLocalEditorReady(true)
      }
      void asyncFunc()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onMessage = (event: WebViewMessageEvent) => {
    let data
    try {
      data = JSON.parse(event.nativeEvent.data)
    } catch (e) {
      log('Message is not valid JSON, returning')
      return
    }
    componentViewer?.handleMessage(data)
  }

  const onFrameLoad = useCallback(() => {
    log('Iframe did load', webViewRef.current?.props.source)

    /**
     * We have no way of knowing if the webview load is successful or not. We
     * have to wait to see if the error event is fired. Looking at the code,
     * the error event is fired right after this, so we can wait just a few ms
     * to see if the error event is fired before registering the component
     * window. Otherwise, on error, this component will be dealloced, and a
     * pending postMessage will cause a memory leak crash on Android in the
     * form of "react native attempt to invoke virtual method
     * double java.lang.double.doublevalue() on a null object reference"
     */
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    if (didLoadRootUrl.current === true || !SupportsShouldLoadRequestHandler) {
      log('Setting component viewer webview')
      timeoutRef.current = setTimeout(() => {
        componentViewer?.setWindow(webViewRef.current as unknown as Window)
      }, 1)
      /**
       * The parent will remove their loading screen on load end. We want to
       * delay this to avoid flicker that may result if using a dark theme.
       * This delay will allow editor to load its theme.
       */
      const isDarkTheme = themeService?.isLikelyUsingDarkColorTheme()
      const delayToAvoidFlicker = isDarkTheme ? 50 : 0
      setTimeout(() => {
        onLoadEnd()
      }, delayToAvoidFlicker)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onLoadStartHandler = () => {
    onLoadStart()
  }

  const onShouldStartLoadWithRequest: OnShouldStartLoadWithRequest = (request) => {
    log('Setting last iframe URL to', request.url)
    /** The first request can typically be 'about:blank', which we want to ignore */
    if (!didLoadRootUrl.current) {
      didLoadRootUrl.current = request.url === componentViewer.url!
    }
    /**
     * We want to handle link clicks within an editor by opening the browser
     * instead of loading inline. On iOS, onShouldStartLoadWithRequest is
     * called for all requests including the initial request to load the editor.
     * On iOS, clicks in the editors have a navigationType of 'click', but on
     * Android, this is not the case (no navigationType).
     * However, on Android, this function is not called for the initial request.
     * So that might be one way to determine if this request is a click or the
     * actual editor load request. But I don't think it's safe to rely on this
     * being the case in the future. So on Android, we'll handle url loads only
     * if the url isn't equal to the editor url.
     */

    if (
      (Platform.OS === 'ios' && request.navigationType === 'click') ||
      (Platform.OS === 'android' && request.url !== componentViewer.url!)
    ) {
      application!.deviceInterface!.openUrl(request.url)
      return false
    }
    return true
  }

  const defaultInjectedJavaScript = () => {
    return `(function() {
      window.parent.postMessage = function(data) {
        window.parent.ReactNativeWebView.postMessage(data);
      };
      const meta = document.createElement('meta');
      meta.setAttribute('content', 'width=device-width, initial-scale=1, user-scalable=no');
      meta.setAttribute('name', 'viewport');
      document.getElementsByTagName('head')[0].appendChild(meta);
      return true;
    })()`
  }

  const deprecationMessage = componentViewer.component.deprecationMessage

  const renderWebview = !requiresLocalEditor || localEditorReady

  return (
    <FlexContainer>
      {componentViewer.component.isExpired && (
        <LockedContainer>
          <StyledIcon />
          <LockedText>
            Subscription expired. Editors are in a read-only state. To edit immediately, please switch to the Plain
            Editor.
          </LockedText>
        </LockedContainer>
      )}

      {componentViewer.component.isDeprecated && (
        <DeprecatedContainer>
          <DeprecatedIcon />
          <DeprecatedText>{deprecationMessage || 'This extension is deprecated.'}</DeprecatedText>
        </DeprecatedContainer>
      )}

      {renderWebview && (
        <StyledWebview
          showWebView={showWebView}
          source={{ uri: componentViewer.url! }}
          key={componentViewer.component.uuid}
          ref={webViewRef}
          /**
           * onLoad and onLoadEnd seem to be the same exact thing, except
           * that when an error occurs, onLoadEnd is called twice, whereas
           * onLoad is called once (what we want)
           */
          onLoad={onFrameLoad}
          onLoadStart={onLoadStartHandler}
          onError={onLoadErrorHandler}
          onHttpError={() => onLoadErrorHandler()}
          onMessage={onMessage}
          hideKeyboardAccessoryView={true}
          setSupportMultipleWindows={false}
          onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
          cacheEnabled={true}
          autoManageStatusBarEnabled={false /* To prevent StatusBar from changing colors when focusing */}
          injectedJavaScript={defaultInjectedJavaScript()}
          onContentProcessDidTerminate={() => onLoadErrorHandler()}
        />
      )}
    </FlexContainer>
  )
}
