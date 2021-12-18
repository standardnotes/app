import {
  ComponentAction,
  FeatureStatus,
  SNComponent,
  dateToLocalizedString,
  ApplicationEvent,
  ComponentViewer,
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
  ({ application, onLoad, componentViewer }) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const excessiveLoadingTimeout = useRef<
      ReturnType<typeof setTimeout> | undefined
    >(undefined);

    const [hasIssueLoading, setHasIssueLoading] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isReloading, setIsReloading] = useState(false);
    const [featureStatus, setFeatureStatus] = useState<FeatureStatus>(
      application.getFeatureStatus(componentViewer.component.identifier)
    );
    const [isComponentValid, setIsComponentValid] = useState(true);
    const [error, setError] = useState<
      'offline-restricted' | 'url-missing' | undefined
    >(undefined);
    const [isDeprecated, setIsDeprecated] = useState(false);
    const [deprecationMessage, setDeprecationMessage] = useState<
      string | undefined
    >(undefined);
    const [isDeprecationMessageDismissed, setIsDeprecationMessageDismissed] =
      useState(false);
    const [didAttemptReload, setDidAttemptReload] = useState(false);
    const [contentWindow, setContentWindow] = useState<Window | null>(null);

    const component = componentViewer.component;

    const manageSubscription = useCallback(() => {
      openSubscriptionDashboard(application);
    }, [application]);

    const reloadIframe = () => {
      setTimeout(() => {
        setIsReloading(true);
        setTimeout(() => {
          setIsReloading(false);
        });
      });
    };

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
      const offlineRestricted =
        component.offlineOnly && !isDesktopApplication();
      const hasUrlError = (function () {
        if (isDesktopApplication()) {
          return !component.local_url && !component.hasValidHostedUrl();
        } else {
          return !component.hasValidHostedUrl();
        }
      })();

      // const readonlyState =
      //   application.componentManager.getReadonlyStateForComponent(component);

      // if (!readonlyState.lockReadonly) {
      //   application.componentManager.setReadonlyStateForComponent(
      //     component,
      //     featureStatus !== FeatureStatus.Entitled
      //   );
      // }
      setIsComponentValid(!offlineRestricted && !hasUrlError);

      if (!isComponentValid) {
        setIsLoading(false);
      }

      if (offlineRestricted) {
        setError('offline-restricted');
      } else if (hasUrlError) {
        setError('url-missing');
      } else {
        setError(undefined);
      }
      setIsDeprecated(component.isDeprecated);
      setDeprecationMessage(component.package_info.deprecation_message);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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
        reloadIframe();
      }
    }, [hasIssueLoading]);

    const handleIframeTakingTooLongToLoad = useCallback(async () => {
      setIsLoading(false);
      setHasIssueLoading(true);

      if (!didAttemptReload) {
        setDidAttemptReload(true);
        reloadIframe();
      } else {
        document.addEventListener(VisibilityChangeKey, onVisibilityChange);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleIframeLoad = useCallback(async (iframe: HTMLIFrameElement) => {
      let hasDesktopError = false;
      const canAccessWindowOrigin = isDesktopApplication();
      if (canAccessWindowOrigin) {
        try {
          const contentWindow = iframe.contentWindow as Window;
          if (!contentWindow.origin || contentWindow.origin === 'null') {
            hasDesktopError = true;
          }
          // eslint-disable-next-line no-empty
        } catch (e) {}
      }
      excessiveLoadingTimeout.current &&
        clearTimeout(excessiveLoadingTimeout.current);
      setContentWindow(iframe.contentWindow);
      setTimeout(() => {
        setIsLoading(false);
        setHasIssueLoading(hasDesktopError);
        onLoad?.(component);
      }, MSToWaitAfterIframeLoadToAvoidFlicker);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
      if (contentWindow) {
        componentViewer.setWindow(contentWindow);
      }
    }, [componentViewer, contentWindow]);

    useEffect(() => {
      if (!iframeRef.current) {
        setContentWindow(null);
        return;
      }

      iframeRef.current.onload = () => {
        const iframe = componentViewer.getIframe();
        if (iframe) {
          setTimeout(() => {
            handleIframeLoad(iframe);
          });
        }
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [iframeRef.current]);

    useEffect(() => {
      const removeFeaturesChangedObserver = application.addEventObserver(
        async () => {
          setFeatureStatus(application.getFeatureStatus(component.identifier));
        },
        ApplicationEvent.FeaturesUpdated
      );

      return () => {
        removeFeaturesChangedObserver();
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
      componentViewer.addActionObserver((action, data) => {
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
      });
    }, [componentViewer, application]);

    useEffect(() => {
      const unregisterDesktopObserver = application
        .getDesktopService()
        .registerUpdateObserver((component: SNComponent) => {
          if (component.uuid === component.uuid && component.active) {
            reloadIframe();
          }
        });

      return () => {
        unregisterDesktopObserver();
      };
    }, [application]);

    return (
      <>
        {hasIssueLoading && (
          <IssueOnLoading
            componentName={component.name}
            reloadIframe={reloadIframe}
          />
        )}
        {featureStatus !== FeatureStatus.Entitled && (
          <IsExpired
            expiredDate={dateToLocalizedString(component.valid_until)}
            reloadStatus={reloadValidityStatus}
            featureStatus={featureStatus}
            componentName={component.name}
            manageSubscription={manageSubscription}
          />
        )}
        {isDeprecated && !isDeprecationMessageDismissed && (
          <IsDeprecated
            deprecationMessage={deprecationMessage}
            dismissDeprecationMessage={dismissDeprecationMessage}
          />
        )}
        {error == 'offline-restricted' && (
          <OfflineRestricted
            isReloading={isReloading}
            reloadStatus={reloadValidityStatus}
          />
        )}
        {error == 'url-missing' && (
          <UrlMissing componentName={component.name} />
        )}
        {component.uuid && !isReloading && isComponentValid && (
          <iframe
            ref={iframeRef}
            data-component-viewer-id={componentViewer.identifier}
            frameBorder={0}
            data-attr-id={`component-iframe-${component.uuid}`}
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
  manualDealloc: '=',
});
