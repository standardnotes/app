import {
  ComponentAction,
  FeatureStatus,
  ComponentViewerInterface,
  ComponentViewerEvent,
  ComponentViewerError,
  ComponentInterface,
  SubscriptionManagerEvent,
} from '@standardnotes/snjs'
import { FunctionComponent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { observer } from 'mobx-react-lite'
import OfflineRestricted from '@/Components/ComponentView/OfflineRestricted'
import UrlMissing from '@/Components/ComponentView/UrlMissing'
import IsDeprecated from '@/Components/ComponentView/IsDeprecated'
import NotEntitledBanner from '@/Components/ComponentView/NotEntitledBanner'
import IssueOnLoading from '@/Components/ComponentView/IssueOnLoading'
import { useApplication } from '../ApplicationProvider'

interface Props {
  componentViewer: ComponentViewerInterface
  requestReload?: (viewer: ComponentViewerInterface, force?: boolean) => void
  onLoad?: () => void
  readonly?: boolean
  usedInModal?: boolean
}

/**
 * The maximum amount of time we'll wait for a component
 * to load before displaying error
 */
const MaxLoadThreshold = 4000
const VisibilityChangeKey = 'visibilitychange'
const MSToWaitAfterIframeLoadToAvoidFlicker = 35

const IframeFeatureView: FunctionComponent<Props> = ({
  onLoad,
  componentViewer,
  requestReload,
  readonly = false,
  usedInModal = false,
}) => {
  const application = useApplication()

  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const [loadTimeout, setLoadTimeout] = useState<ReturnType<typeof setTimeout> | undefined>(undefined)

  const [hasIssueLoading, setHasIssueLoading] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [featureStatus, setFeatureStatus] = useState<FeatureStatus>(componentViewer.getFeatureStatus())
  const [isComponentValid, setIsComponentValid] = useState(true)
  const [error, setError] = useState<ComponentViewerError | undefined>(undefined)
  const [deprecationMessage, setDeprecationMessage] = useState<string | undefined>(undefined)
  const [isDeprecationMessageDismissed, setIsDeprecationMessageDismissed] = useState(false)
  const [didAttemptReload, setDidAttemptReload] = useState(false)

  const uiFeature = componentViewer.getComponentOrFeatureItem()

  const reloadValidityStatus = useCallback(() => {
    setFeatureStatus(componentViewer.getFeatureStatus())
    if (!componentViewer.lockReadonly) {
      componentViewer.setReadonly(featureStatus !== FeatureStatus.Entitled || readonly)
    }
    setIsComponentValid(componentViewer.shouldRender())

    if (isLoading && !isComponentValid) {
      setIsLoading(false)
    }

    setError(componentViewer.getError())
    setDeprecationMessage(uiFeature.deprecationMessage)
  }, [componentViewer, isLoading, isComponentValid, uiFeature.deprecationMessage, featureStatus, readonly])

  useEffect(() => {
    reloadValidityStatus()
  }, [reloadValidityStatus])

  useEffect(() => {
    return application.subscriptions.addEventObserver((event) => {
      if (event === SubscriptionManagerEvent.DidFetchSubscription) {
        reloadValidityStatus()
      }
    })
  }, [application.subscriptions, reloadValidityStatus])

  const dismissDeprecationMessage = () => {
    setIsDeprecationMessageDismissed(true)
  }

  const onVisibilityChange = useCallback(() => {
    if (document.visibilityState === 'hidden') {
      return
    }
    if (hasIssueLoading) {
      requestReload?.(componentViewer)
    }
  }, [hasIssueLoading, componentViewer, requestReload])

  useEffect(() => {
    const loadTimeout = setTimeout(() => {
      setIsLoading(false)
      setHasIssueLoading(true)

      if (!didAttemptReload) {
        setDidAttemptReload(true)
        requestReload?.(componentViewer)
      } else {
        document.addEventListener(VisibilityChangeKey, onVisibilityChange)
      }
    }, MaxLoadThreshold)

    setLoadTimeout(loadTimeout)

    return () => {
      if (loadTimeout) {
        clearTimeout(loadTimeout)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [componentViewer])

  const onIframeLoad = useCallback(() => {
    const iframe = iframeRef.current as HTMLIFrameElement
    const contentWindow = iframe.contentWindow as Window

    if (loadTimeout) {
      clearTimeout(loadTimeout)
    }

    try {
      componentViewer.setWindow(contentWindow)
    } catch (error) {
      console.error(error)
    }

    setTimeout(() => {
      setIsLoading(false)
      setHasIssueLoading(false)
      onLoad?.()
    }, MSToWaitAfterIframeLoadToAvoidFlicker)
  }, [componentViewer, onLoad, loadTimeout])

  useEffect(() => {
    const removeFeaturesChangedObserver = componentViewer.addEventObserver((event) => {
      if (event === ComponentViewerEvent.FeatureStatusUpdated) {
        setFeatureStatus(componentViewer.getFeatureStatus())
      }
    })

    return () => {
      removeFeaturesChangedObserver()
    }
  }, [componentViewer])

  useEffect(() => {
    const removeActionObserver = componentViewer.addActionObserver((action, data) => {
      switch (action) {
        case ComponentAction.KeyDown:
          application.keyboardService.handleComponentKeyDown(data.keyboardModifier)
          break
        case ComponentAction.KeyUp:
          application.keyboardService.handleComponentKeyUp(data.keyboardModifier)
          break
        case ComponentAction.Click:
          application.notesController.setContextMenuOpen(false)
          break
        default:
          return
      }
    })
    return () => {
      removeActionObserver()
    }
  }, [componentViewer, application])

  useEffect(() => {
    const unregisterDesktopObserver = application.desktopManager?.registerUpdateObserver(
      (updatedComponent: ComponentInterface) => {
        if (updatedComponent.uuid === uiFeature.uniqueIdentifier.value) {
          requestReload?.(componentViewer)
        }
      },
    )

    return () => {
      unregisterDesktopObserver?.()
    }
  }, [application, requestReload, componentViewer, uiFeature])

  const sandboxAttributes = useMemo(() => {
    const attributes = [
      'allow-scripts',
      'allow-top-navigation-by-user-activation',
      'allow-popups',
      'allow-modals',
      'allow-forms',
      'allow-downloads',
    ]

    if (uiFeature.isNativeFeature) {
      attributes.push('allow-popups-to-escape-sandbox')
    }

    if (application.isNativeMobileWeb()) {
      /**
       * Native mobile web serves native components through the file:// protocol.
       * Native mobile web also does not use localStorage, unlike the web app.
       * So, components served through the file:// (precompiled editors) will be treated
       * as same origin as the parent app, but will not have meaningful access.
       *
       * Third party components will have a non-file:// origin, and thus don't need this attribute.
       */
      if (uiFeature.isNativeFeature) {
        attributes.push('allow-same-origin')
      }
    }

    return attributes
  }, [application, uiFeature])

  return (
    <>
      {hasIssueLoading && (
        <IssueOnLoading
          componentName={uiFeature.displayName}
          reloadIframe={() => {
            reloadValidityStatus(), requestReload?.(componentViewer, true)
          }}
        />
      )}

      {featureStatus !== FeatureStatus.Entitled && (
        <NotEntitledBanner featureStatus={featureStatus} feature={uiFeature.featureDescription} />
      )}
      {deprecationMessage && !isDeprecationMessageDismissed && (
        <IsDeprecated deprecationMessage={deprecationMessage} dismissDeprecationMessage={dismissDeprecationMessage} />
      )}

      {error === ComponentViewerError.OfflineRestricted && <OfflineRestricted />}

      {error === ComponentViewerError.MissingUrl && <UrlMissing componentName={uiFeature.displayName} />}

      {uiFeature.uniqueIdentifier && isComponentValid && (
        <iframe
          className="h-full w-full flex-grow bg-transparent"
          ref={iframeRef}
          onLoad={onIframeLoad}
          data-component-viewer-id={componentViewer.identifier}
          frameBorder={0}
          src={componentViewer.url || ''}
          sandbox={sandboxAttributes.join(' ')}
          {...(usedInModal && { 'data-used-in-modal': true })}
        >
          Loading
        </iframe>
      )}
      {isLoading && <div className={'loading-overlay'} />}
    </>
  )
}

export default observer(IframeFeatureView)
