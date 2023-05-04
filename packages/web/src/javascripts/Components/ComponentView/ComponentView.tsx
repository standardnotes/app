import {
  ComponentAction,
  FeatureStatus,
  SNComponent,
  dateToLocalizedString,
  ComponentViewerInterface,
  ComponentViewerEvent,
  ComponentViewerError,
} from '@standardnotes/snjs'
import { WebApplication } from '@/Application/WebApplication'
import { FunctionComponent, useCallback, useEffect, useRef, useState } from 'react'
import { observer } from 'mobx-react-lite'
import OfflineRestricted from '@/Components/ComponentView/OfflineRestricted'
import UrlMissing from '@/Components/ComponentView/UrlMissing'
import IsDeprecated from '@/Components/ComponentView/IsDeprecated'
import IsExpired from '@/Components/ComponentView/IsExpired'
import IssueOnLoading from '@/Components/ComponentView/IssueOnLoading'
import { openSubscriptionDashboard } from '@/Utils/ManageSubscription'

interface IProps {
  application: WebApplication
  componentViewer: ComponentViewerInterface
  requestReload?: (viewer: ComponentViewerInterface, force?: boolean) => void
  onLoad?: (component: SNComponent) => void
}

/**
 * The maximum amount of time we'll wait for a component
 * to load before displaying error
 */
const MaxLoadThreshold = 4000
const VisibilityChangeKey = 'visibilitychange'
const MSToWaitAfterIframeLoadToAvoidFlicker = 35

const ComponentView: FunctionComponent<IProps> = ({ application, onLoad, componentViewer, requestReload }) => {
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

  const component: SNComponent = componentViewer.component

  const manageSubscription = useCallback(() => {
    void openSubscriptionDashboard(application)
  }, [application])

  const reloadValidityStatus = useCallback(() => {
    setFeatureStatus(componentViewer.getFeatureStatus())
    if (!componentViewer.lockReadonly) {
      componentViewer.setReadonly(featureStatus !== FeatureStatus.Entitled)
    }
    setIsComponentValid(componentViewer.shouldRender())

    if (isLoading && !isComponentValid) {
      setIsLoading(false)
    }

    setError(componentViewer.getError())
    setDeprecationMessage(component.deprecationMessage)
  }, [componentViewer, component.deprecationMessage, featureStatus, isComponentValid, isLoading])

  useEffect(() => {
    reloadValidityStatus()
  }, [reloadValidityStatus])

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
      onLoad?.(component)
    }, MSToWaitAfterIframeLoadToAvoidFlicker)
  }, [componentViewer, onLoad, component, loadTimeout])

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
          application.getViewControllerManager().notesController.setContextMenuOpen(false)
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
    const unregisterDesktopObserver = application
      .getDesktopService()
      ?.registerUpdateObserver((updatedComponent: SNComponent) => {
        if (updatedComponent.uuid === component.uuid && updatedComponent.active) {
          requestReload?.(componentViewer)
        }
      })

    return () => {
      unregisterDesktopObserver?.()
    }
  }, [application, requestReload, componentViewer, component.uuid])

  return (
    <>
      {hasIssueLoading && (
        <IssueOnLoading
          componentName={component.displayName}
          reloadIframe={() => {
            reloadValidityStatus(), requestReload?.(componentViewer, true)
          }}
        />
      )}

      {featureStatus !== FeatureStatus.Entitled && (
        <IsExpired
          expiredDate={dateToLocalizedString(component.valid_until)}
          featureStatus={featureStatus}
          componentName={component.displayName}
          manageSubscription={manageSubscription}
        />
      )}
      {deprecationMessage && !isDeprecationMessageDismissed && (
        <IsDeprecated deprecationMessage={deprecationMessage} dismissDeprecationMessage={dismissDeprecationMessage} />
      )}
      {error === ComponentViewerError.OfflineRestricted && <OfflineRestricted />}
      {error === ComponentViewerError.MissingUrl && <UrlMissing componentName={component.displayName} />}
      {component.uuid && isComponentValid && (
        <iframe
          className="h-full w-full flex-grow bg-transparent"
          ref={iframeRef}
          onLoad={onIframeLoad}
          data-component-viewer-id={componentViewer.identifier}
          frameBorder={0}
          src={componentViewer.url || ''}
          sandbox="allow-scripts allow-top-navigation-by-user-activation allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-modals allow-forms allow-downloads"
        >
          Loading
        </iframe>
      )}
      {isLoading && <div className={'loading-overlay'} />}
    </>
  )
}

export default observer(ComponentView)
