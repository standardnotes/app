import { ComponentView } from '@/components/ComponentView';
import { SmartTagsSection } from '@/components/Tags/SmartTagsSection';
import { TagsSection } from '@/components/Tags/TagsSection';
import { WebApplication } from '@/ui_models/application';
import { PANEL_NAME_NAVIGATION } from '@/views/constants';
import { ApplicationEvent, PrefKey } from '@standardnotes/snjs';
import { observer } from 'mobx-react-lite';
import { FunctionComponent } from 'preact';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'preact/hooks';
import { PremiumModalProvider } from './Premium';
import { PanelSide, ResizeFinishCallback, PanelResizer } from './PanelResizer';

type Props = {
  application: WebApplication;
};

export const Navigation: FunctionComponent<Props> = observer(
  ({ application }) => {
    const appState = useMemo(() => application.getAppState(), [application]);
    const componentViewer = appState.foldersComponentViewer;
    const enableNativeSmartTagsFeature =
      appState.features.enableNativeSmartTagsFeature;
    const ref = useRef<HTMLDivElement>(null);
    const [panelWidth, setPanelWidth] = useState<number>(0);

    useEffect(() => {
      const removeObserver = application.addEventObserver(async () => {
        const width = application.getPreference(PrefKey.TagsPanelWidth);
        if (width) {
          setPanelWidth(width);
        }
      }, ApplicationEvent.PreferencesChanged);

      return () => {
        removeObserver();
      };
    }, [application]);

    const onCreateNewTag = useCallback(() => {
      appState.tags.createNewTemplate();
    }, [appState]);

    const panelResizeFinishCallback: ResizeFinishCallback = useCallback(
      (width, _lastLeft, _isMaxWidth, isCollapsed) => {
        application.setPreference(PrefKey.TagsPanelWidth, width);
        appState.noteTags.reloadTagsContainerMaxWidth();
        appState.panelDidResize(PANEL_NAME_NAVIGATION, isCollapsed);
      },
      [application, appState]
    );

    const panelWidthEventCallback = useCallback(() => {
      appState.noteTags.reloadTagsContainerMaxWidth();
    }, [appState]);

    return (
      <PremiumModalProvider state={appState.features}>
        <div
          id="navigation"
          className="sn-component section"
          data-aria-label="Navigation"
          ref={ref}
        >
          {componentViewer ? (
            <div className="component-view-container">
              <div className="component-view">
                <ComponentView
                  componentViewer={componentViewer}
                  application={application}
                  appState={appState}
                />
              </div>
            </div>
          ) : (
            <div id="navigation-content" className="content">
              <div className="section-title-bar">
                <div className="section-title-bar-header">
                  <div className="sk-h3 title">
                    <span className="sk-bold">Views</span>
                  </div>
                  {!enableNativeSmartTagsFeature && (
                    <div
                      className="sk-button sk-secondary-contrast wide"
                      onClick={onCreateNewTag}
                      title="Create a new tag"
                    >
                      <div className="sk-label">
                        <i className="icon ion-plus add-button" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="scrollable">
                <SmartTagsSection appState={appState} />
                <TagsSection appState={appState} />
              </div>
            </div>
          )}
          {ref.current && (
            <PanelResizer
              collapsable={true}
              defaultWidth={150}
              panel={ref.current}
              hoverable={true}
              side={PanelSide.Right}
              resizeFinishCallback={panelResizeFinishCallback}
              widthEventCallback={panelWidthEventCallback}
              width={panelWidth}
              left={0}
            />
          )}
        </div>
      </PremiumModalProvider>
    );
  }
);
