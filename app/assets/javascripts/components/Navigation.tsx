import { ComponentView } from '@/components/ComponentView';
import { PanelResizer } from '@/components/PanelResizer';
import { PremiumModalProvider } from '@/components/Premium';
import { SmartTagsSection } from '@/components/Tags/SmartTagsSection';
import { TagsSection } from '@/components/Tags/TagsSection';
import { toDirective } from '@/components/utils';
import {
  PanelSide,
  ResizeFinishCallback,
} from '@/directives/views/panelResizer';
import { WebApplication } from '@/ui_models/application';
import { PANEL_NAME_TAGS } from '@/views/constants';
import { PrefKey } from '@standardnotes/snjs';
import { observer } from 'mobx-react-lite';
import { FunctionComponent } from 'preact';
import { useCallback, useMemo, useRef } from 'preact/hooks';

type Props = {
  application: WebApplication;
};

export const Navigation: FunctionComponent<Props> = observer(
  ({ application }) => {
    const panelRef = useRef<HTMLDivElement>(null);
    const appState = useMemo(() => application.getAppState(), [application]); // TODO: define only one way to do this
    const component = appState.tagsListComponent;
    const enableNativeSmartTagsFeature =
      appState.features.enableNativeSmartTagsFeature;

    const onCreateNewTag = useCallback(() => {
      appState.tags.createNewTemplate();
    }, [appState]);

    const panelResizeFinishCallback: ResizeFinishCallback = useCallback(
      (_w, _l, _mw, isCollapsed) => {
        appState.noteTags.reloadTagsContainerMaxWidth(); // TODO: probably not updated
        appState.panelDidResize(PANEL_NAME_TAGS, isCollapsed); // TODO: Rename
      },
      [appState]
    );

    const panelWidthEventCallback = useCallback(() => {
      appState.noteTags.reloadTagsContainerMaxWidth(); // TODO: probably not updated
    }, [appState]);

    console.log(panelRef, panelRef.current);

    return (
      <PremiumModalProvider>
        <div
          id="tags-column"
          ref={panelRef}
          className="sn-component section tags"
          data-aria-label="Tags"
        >
          {component ? (
            <div className="component-view-container">
              {/* TODO: add back class .component-view */}
              <ComponentView
                componentUuid={component.uuid}
                application={application}
                appState={appState}
              />
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
        </div>
        {panelRef.current && (
          <PanelResizer
            application={application}
            collapsable={true}
            defaultWidth={150}
            panel={document.querySelector('navigation') as HTMLDivElement}
            prefKey={PrefKey.TagsPanelWidth}
            side={PanelSide.Left}
            resizeFinishCallback={panelResizeFinishCallback}
            widthEventCallback={panelWidthEventCallback}
          />
        )}
      </PremiumModalProvider>
    );
  }
);

export const NavigationDirective = toDirective<Props>(Navigation);
