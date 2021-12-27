import { ComponentView } from '@/components/ComponentView';
import { PanelResizer } from '@/components/PanelResizer';
import { SmartTagsSection } from '@/components/Tags/SmartTagsSection';
import { TagsSection } from '@/components/Tags/TagsSection';
import { toDirective } from '@/components/utils';
import {
  PanelSide,
  ResizeFinishCallback,
} from '@/directives/views/panelResizer';
import { WebApplication } from '@/ui_models/application';
import { PANEL_NAME_NAVIGATION } from '@/views/constants';
import { PrefKey } from '@standardnotes/snjs';
import { observer } from 'mobx-react-lite';
import { FunctionComponent } from 'preact';
import { useCallback, useEffect, useMemo, useState } from 'preact/hooks';
import { PremiumModalProvider } from './Premium';

type Props = {
  application: WebApplication;
};

export const Navigation: FunctionComponent<Props> = observer(
  ({ application }) => {
    const appState = useMemo(() => application.getAppState(), [application]);
    const componentViewer = appState.foldersComponentViewer;
    const enableNativeSmartTagsFeature =
      appState.features.enableNativeSmartTagsFeature;
    const [panelRef, setPanelRef] = useState<HTMLDivElement | null>(null);

    useEffect(() => {
      const elem = document.querySelector(
        'navigation'
      ) as HTMLDivElement | null;
      setPanelRef(elem);
    }, [setPanelRef]);

    const onCreateNewTag = useCallback(() => {
      appState.tags.createNewTemplate();
    }, [appState]);

    const panelResizeFinishCallback: ResizeFinishCallback = useCallback(
      (_w, _l, _mw, isCollapsed) => {
        appState.noteTags.reloadTagsContainerMaxWidth();
        appState.panelDidResize(PANEL_NAME_NAVIGATION, isCollapsed);
      },
      [appState]
    );

    const panelWidthEventCallback = useCallback(() => {
      appState.noteTags.reloadTagsContainerMaxWidth();
    }, [appState]);

    return (
      <PremiumModalProvider state={appState.features}>
        <div
          id="tags-column"
          ref={setPanelRef}
          className="sn-component section tags"
          data-aria-label="Tags"
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
            <div id="tags-content" className="content">
              <div className="tags-title-section section-title-bar">
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
                <div className="infinite-scroll">
                  <SmartTagsSection appState={appState} />
                  <TagsSection appState={appState} />
                </div>
              </div>
            </div>
          )}
          {panelRef && (
            <PanelResizer
              application={application}
              collapsable={true}
              defaultWidth={150}
              panel={panelRef}
              prefKey={PrefKey.TagsPanelWidth}
              side={PanelSide.Right}
              resizeFinishCallback={panelResizeFinishCallback}
              widthEventCallback={panelWidthEventCallback}
            />
          )}
        </div>
      </PremiumModalProvider>
    );
  }
);

export const NavigationDirective = toDirective<Props>(Navigation);
