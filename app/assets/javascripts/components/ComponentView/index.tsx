import {
  ComponentAction,
  FeatureStatus,
  SNComponent,
  dateToLocalizedString,
  ComponentViewer,
  ComponentViewerEvent,
  ComponentViewerError,
} from '@standardnotes/snjs';
import { WebApplication } from '@/ui_models/application';
import { FunctionalComponent } from 'preact';
import { toDirective } from '@/components/utils';
import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import { observer } from 'mobx-react-lite';
import { isDesktopApplication } from '@/utils';
import { OfflineRestricted } from '@/components/ComponentView/OfflineRestricted';
import { UrlMissing } from '@/components/ComponentView/UrlMissing';
import { IsDeprecated } from '@/components/ComponentView/IsDeprecated';
import { IsExpired } from '@/components/ComponentView/IsExpired';
import { IssueOnLoading } from '@/components/ComponentView/IssueOnLoading';
import { AppState } from '@/ui_models/app_state';
import { openSubscriptionDashboard } from '@/hooks/manageSubscription';

interface IProps {
  application: WebApplication;
  appState: AppState;
  componentViewer: ComponentViewer;
  requestReload?: (viewer: ComponentViewer) => void;
  onLoad?: (component: SNComponent) => void;
  manualDealloc?: boolean;
}

/**
 * The maximum amount of time we'll wait for a component
 * to load before displaying error
 */
const MaxLoadThreshold = 4000;
const VisibilityChangeKey = 'visibilitychange';
const MSToWaitAfterIframeLoadToAvoidFlicker = 35;

export const ComponentView: FunctionalComponent<IProps> = observer(
  ({ application, onLoad, componentViewer, requestReload }) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const excessiveLoadingTimeout = useRef<
      ReturnType<typeof setTimeout> | undefined
    >(undefined);

    const [hasIssueLoading, setHasIssueLoading] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [featureStatus, setFeatureStatus] = useState<FeatureStatus>(
      componentViewer.getFeatureStatus()
    );
    const [isComponentValid, setIsComponentValid] = useState(true);
    const [error, setError] = useState<ComponentViewerError | undefined>(
      undefined
    );
    const [deprecationMessage, setDeprecationMessage] = useState<
      string | undefined
    >(undefined);
    const [isDeprecationMessageDismissed, setIsDeprecationMessageDismissed] =
      useState(false);
    const [didAttemptReload, setDidAttemptReload] = useState(false);

    const component = componentViewer.component;

    const manageSubscription = useCallback(() => {
      openSubscriptionDashboard(application);
    }, [application]);

    useEffect(() => {
      const loadTimeout = setTimeout(() => {
        handleIframeTakingTooLongToLoad();
      }, MaxLoadThreshold);

      excessiveLoadingTimeout.current = loadTimeout;

      return () => {
        excessiveLoadingTimeout.current &&
          clearTimeout(excessiveLoadingTimeout.current);
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const reloadValidityStatus = useCallback(() => {
      setFeatureStatus(componentViewer.getFeatureStatus());
      if (!componentViewer.lockReadonly) {
        componentViewer.setReadonly(featureStatus !== FeatureStatus.Entitled);
      }
      setIsComponentValid(componentViewer.shouldRender());

      if (isLoading && !isComponentValid) {
        setIsLoading(false);
      }

      setError(componentViewer.getError());
      setDeprecationMessage(component.deprecationMessage);
    }, [
      componentViewer,
      component.deprecationMessage,
      featureStatus,
      isComponentValid,
      isLoading,
    ]);

    useEffect(() => {
      reloadValidityStatus();
    }, [reloadValidityStatus]);

    const dismissDeprecationMessage = () => {
      setIsDeprecationMessageDismissed(true);
    };

    const onVisibilityChange = useCallback(() => {
      if (document.visibilityState === 'hidden') {
        return;
      }
      if (hasIssueLoading) {
        requestReload?.(componentViewer);
      }
    }, [hasIssueLoading, componentViewer, requestReload]);

    const handleIframeTakingTooLongToLoad = useCallback(async () => {
      setIsLoading(false);
      setHasIssueLoading(true);

      if (!didAttemptReload) {
        setDidAttemptReload(true);
        requestReload?.(componentViewer);
      } else {
        document.addEventListener(VisibilityChangeKey, onVisibilityChange);
      }
    }, [componentViewer, didAttemptReload, onVisibilityChange, requestReload]);

    useEffect(() => {
      if (!iframeRef.current) {
        return;
      }

      const iframe = iframeRef.current as HTMLIFrameElement;
      iframe.onload = () => {
        const contentWindow = iframe.contentWindow as Window;

        let hasDesktopError = false;
        const canAccessWindowOrigin = isDesktopApplication();
        if (canAccessWindowOrigin) {
          try {
            if (!contentWindow.origin || contentWindow.origin === 'null') {
              hasDesktopError = true;
            }
          } catch (e) {
            console.error(e);
          }
        }

        excessiveLoadingTimeout.current &&
          clearTimeout(excessiveLoadingTimeout.current);

        componentViewer.setWindow(contentWindow);

        setTimeout(() => {
          setIsLoading(false);
          setHasIssueLoading(hasDesktopError);
          onLoad?.(component);
        }, MSToWaitAfterIframeLoadToAvoidFlicker);
      };
    }, [onLoad, component, componentViewer]);

    useEffect(() => {
      const removeFeaturesChangedObserver = componentViewer.addEventObserver(
        (event) => {
          if (event === ComponentViewerEvent.FeatureStatusUpdated) {
            setFeatureStatus(componentViewer.getFeatureStatus());
          }
        }
      );

      return () => {
        removeFeaturesChangedObserver();
      };
    }, [componentViewer]);

    useEffect(() => {
      const removeActionObserver = componentViewer.addActionObserver(
        (action, data) => {
          switch (action) {
            case ComponentAction.KeyDown:
              application.io.handleComponentKeyDown(data.keyboardModifier);
              break;
            case ComponentAction.KeyUp:
              application.io.handleComponentKeyUp(data.keyboardModifier);
              break;
            case ComponentAction.Click:
              application.getAppState().notes.setContextMenuOpen(false);
              break;
            default:
              return;
          }
        }
      );
      return () => {
        removeActionObserver();
      };
    }, [componentViewer, application]);

    useEffect(() => {
      const unregisterDesktopObserver = application
        .getDesktopService()
        .registerUpdateObserver((component: SNComponent) => {
          if (component.uuid === component.uuid && component.active) {
            requestReload?.(componentViewer);
          }
        });

      return () => {
        unregisterDesktopObserver();
      };
    }, [application, requestReload, componentViewer]);

    return (
      <>
        {hasIssueLoading && (
          <IssueOnLoading
            componentName={component.name}
            reloadIframe={() => {
              reloadValidityStatus(), requestReload?.(componentViewer);
            }}
          />
        )}

        {featureStatus !== FeatureStatus.Entitled && (
          <IsExpired
            expiredDate={dateToLocalizedString(component.valid_until)}
            featureStatus={featureStatus}
            componentName={component.name}
            manageSubscription={manageSubscription}
          />
        )}
        {deprecationMessage && !isDeprecationMessageDismissed && (
          <IsDeprecated
            deprecationMessage={deprecationMessage}
            dismissDeprecationMessage={dismissDeprecationMessage}
          />
        )}
        {error === ComponentViewerError.OfflineRestricted && (
          <OfflineRestricted />
        )}
        {error === ComponentViewerError.MissingUrl && (
          <UrlMissing componentName={component.name} />
        )}
        {component.uuid && isComponentValid && (
          <iframe
            ref={iframeRef}
            data-component-viewer-id={componentViewer.identifier}
            frameBorder={0}
            src={application.componentManager.urlForComponent(component) || ''}
            sandbox="allow-scripts allow-top-navigation-by-user-activation allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-modals allow-forms allow-downloads"
          >
            Loading
          </iframe>
        )}
        {isLoading && <div className={'loading-overlay'} />}
      </>
    );
  }
);

export const ComponentViewDirective = toDirective<IProps>(ComponentView, {
  onLoad: '=',
  componentViewer: '=',
  requestReload: '=',
  manualDealloc: '=',
});
