import { ComponentAction, FeatureStatus, LiveItem, SNComponent, dateToLocalizedString } from '@standardnotes/snjs';
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
import { ComponentArea } from '@node_modules/@standardnotes/features';
import { openSubscriptionDashboard } from '@/hooks/manageSubscription';

interface IProps {
  application: WebApplication;
  appState: AppState;
  componentUuid: string;
  onLoad?: (component: SNComponent) => void;
  templateComponent?: SNComponent;
  manualDealloc?: boolean;
}

/**
 * The maximum amount of time we'll wait for a component
 * to load before displaying error
 */
const MaxLoadThreshold = 4000;
const VisibilityChangeKey = 'visibilitychange';
const avoidFlickerTimeout = 7;

export const ComponentView: FunctionalComponent<IProps> = observer(
  ({
    application,
    appState,
    onLoad,
    componentUuid,
    templateComponent
  }) => {
    const liveComponentRef = useRef<LiveItem<SNComponent> | null>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);

    const [isIssueOnLoading, setIsIssueOnLoading] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isReloading, setIsReloading] = useState(false);
    const [loadTimeout, setLoadTimeout] = useState<number | undefined>(undefined);
    const [featureStatus, setFeatureStatus] = useState<FeatureStatus | undefined>(undefined);
    const [isComponentValid, setIsComponentValid] = useState(true);
    const [error, setError] = useState<'offline-restricted' | 'url-missing' | undefined>(undefined);
    const [isDeprecated, setIsDeprecated] = useState(false);
    const [deprecationMessage, setDeprecationMessage] = useState<string | undefined>(undefined);
    const [isDeprecationMessageDismissed, setIsDeprecationMessageDismissed] = useState(false);
    const [didAttemptReload, setDidAttemptReload] = useState(false);
    const [component, setComponent] = useState<SNComponent | undefined>(undefined);

    const getComponent = useCallback((): SNComponent => {
      return (templateComponent || liveComponentRef.current?.item) as SNComponent;
    }, [templateComponent]);

    const reloadIframe = () => {
      setTimeout(() => {
        setIsReloading(true);
        setTimeout(() => {
          setIsReloading(false);
        });
      });
    };

    const manageSubscription = useCallback(() => {
      openSubscriptionDashboard(application);
    }, [application]);

    const reloadStatus = useCallback(() => {
      if (!component) {
        return;
      }

      const offlineRestricted = component.offlineOnly && !isDesktopApplication();
      const hasUrlError = function () {
        if (isDesktopApplication()) {
          return !component.local_url && !component.hasValidHostedUrl();
        } else {
          return !component.hasValidHostedUrl();
        }
      }();

      setFeatureStatus(application.getFeatureStatus(component.identifier));

      const readonlyState = application.componentManager.getReadonlyStateForComponent(component);

      if (!readonlyState.lockReadonly) {
        application.componentManager.setReadonlyStateForComponent(component, featureStatus !== FeatureStatus.Entitled);
      }
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
    }, [application, component, isComponentValid, featureStatus]);

    const dismissDeprecationMessage = () => {
      setTimeout(() => {
        setIsDeprecationMessageDismissed(true);
      });
    };

    const onVisibilityChange = useCallback(() => {
      if (document.visibilityState === 'hidden') {
        return;
      }
      if (isIssueOnLoading) {
        reloadIframe();
      }
    }, [isIssueOnLoading]);

    const handleIframeLoadTimeout = useCallback(async () => {
      if (isLoading) {
        setIsLoading(false);
        setIsIssueOnLoading(true);

        if (!didAttemptReload) {
          setDidAttemptReload(true);
          reloadIframe();
        } else {
          document.addEventListener(
            VisibilityChangeKey,
            onVisibilityChange
          );
        }
      }
    }, [didAttemptReload, isLoading, onVisibilityChange]);

    const handleIframeLoad = useCallback(async (iframe: HTMLIFrameElement) => {
      if (!component) {
        return;
      }

      let desktopError = false;
      if (isDesktopApplication()) {
        try {
          /** Accessing iframe.contentWindow.origin only allowed in desktop app. */
          if (!iframe.contentWindow!.origin || iframe.contentWindow!.origin === 'null') {
            desktopError = true;
          }
          // eslint-disable-next-line no-empty
        } catch (e) {
        }
      }
      clearTimeout(loadTimeout);
      await application.componentManager.registerComponentWindow(
        component,
        iframe.contentWindow!
      );

      setTimeout(() => {
        setIsLoading(false);
        setIsIssueOnLoading(desktopError ? true : false);
        onLoad?.(component!);
      }, avoidFlickerTimeout);
    }, [application.componentManager, component, loadTimeout, onLoad]);

    const loadComponent = useCallback(() => {
      if (!component) {
        throw Error('Component view is missing component');
      }

      if (!component.active && !component.isEditor() && component.area !== ComponentArea.Modal) {
        /** Editors don't need to be active to be displayed */
        throw Error('Component view component must be active');
      }

      setIsLoading(true);
      if (loadTimeout) {
        clearTimeout(loadTimeout);
      }
      const timeoutHandler = setTimeout(() => {
        handleIframeLoadTimeout();
      }, MaxLoadThreshold);

      setLoadTimeout(timeoutHandler);
    }, [component, handleIframeLoadTimeout, loadTimeout]);

    useEffect(() => {
      reloadStatus();
      if (!iframeRef.current) {
        return;
      }

      iframeRef.current.onload = () => {
        if (!component) {
          return;
        }

        const iframe = application.componentManager.iframeForComponent(
          component.uuid
        );
        if (!iframe) {
          return;
        }

        setTimeout(() => {
          loadComponent();
          reloadStatus();
          handleIframeLoad(iframe);
        });
      };
    }, [application.componentManager, component, handleIframeLoad, loadComponent, reloadStatus]);

    const getUrl = () => {
      const url = component ? application.componentManager.urlForComponent(component) : '';
      return url as string;
    };

    useEffect(() => {
      if (componentUuid) {
        liveComponentRef.current = new LiveItem(componentUuid, application);
      } else {
        application.componentManager.addTemporaryTemplateComponent(templateComponent as SNComponent);
      }

      return () => {
        if (application.componentManager) {
          /** Component manager Can be destroyed already via locking */
          if (component) {
            application.componentManager.onComponentIframeDestroyed(component.uuid);
          }
          if (templateComponent) {
            application.componentManager.removeTemporaryTemplateComponent(templateComponent);
          }
        }

        if (liveComponentRef.current) {
          liveComponentRef.current.deinit();
        }

        document.removeEventListener(
          VisibilityChangeKey,
          onVisibilityChange
        );
      };
    }, [appState, application, component, componentUuid, onVisibilityChange, reloadStatus, templateComponent]);

    useEffect(() => {
      // Set/update `component` based on `componentUuid` prop.
      // It's a hint that the props were changed and we should rerender this component (and particularly, the iframe).
      if (!component || component.uuid && componentUuid && component.uuid !== componentUuid) {
        const latestComponentValue = getComponent();
        setComponent(latestComponentValue);
      }
    }, [component, componentUuid, getComponent]);

    useEffect(() => {
      if (!component) {
        return;
      }

      const unregisterComponentHandler = application.componentManager.registerHandler({
        identifier: 'component-view-' + Math.random(),
        areas: [component.area],
        actionHandler: (component, action, data) => {
          switch (action) {
            case (ComponentAction.SetSize):
              application.componentManager.handleSetSizeEvent(component, data);
              break;
            case (ComponentAction.KeyDown):
              application.io.handleComponentKeyDown(data.keyboardModifier);
              break;
            case (ComponentAction.KeyUp):
              application.io.handleComponentKeyUp(data.keyboardModifier);
              break;
            case (ComponentAction.Click):
              application.getAppState().notes.setContextMenuOpen(false);
              break;
            default:
              return;
          }
        }
      });

      return () => {
        unregisterComponentHandler();
      };
    }, [application, component]);

    useEffect(() => {
      const unregisterDesktopObserver = application.getDesktopService()
        .registerUpdateObserver((component: SNComponent) => {
          if (component.uuid === component.uuid && component.active) {
            reloadIframe();
          }
        });

      return () => {
        unregisterDesktopObserver();
      };
    }, [application]);

    if (!component) {
      return null;
    }

    return (
      <>
        {isIssueOnLoading && (
          <IssueOnLoading
            componentName={component.name}
            reloadIframe={reloadIframe}
          />
        )}
        {featureStatus !== FeatureStatus.Entitled && !isNaN(component.valid_until.getTime()) && (
          <IsExpired
            expiredDate={dateToLocalizedString(component.valid_until)}
            reloadStatus={reloadStatus}
            featureStatus={featureStatus!}
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
          <OfflineRestricted isReloading={isReloading} reloadStatus={reloadStatus} />
        )}
        {error == 'url-missing' && (
          <UrlMissing componentName={component.name} />
        )}
        {component.uuid && !isReloading && isComponentValid && (
          <iframe
            ref={iframeRef}
            data-component-id={component.uuid}
            frameBorder={0}
            data-attr-id={`component-iframe-${component.uuid}`}
            src={getUrl()}
            sandbox='allow-scripts allow-top-navigation-by-user-activation allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-modals allow-forms allow-downloads'
          >
            Loading
          </iframe>
        )}
        {isLoading && (
          <div className={'loading-overlay'} />
        )}
      </>
    );
  });

export const ComponentViewDirective = toDirective<IProps>(ComponentView, {
  onLoad: '=',
  componentUuid: '=',
  templateComponent: '=',
  manualDealloc: '='
});
