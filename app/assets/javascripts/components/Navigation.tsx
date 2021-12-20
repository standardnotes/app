import { PremiumModalProvider } from '@/components/Premium';
import { toDirective } from '@/components/utils';
import { WebApplication } from '@/ui_models/application';
import { observer } from 'mobx-react-lite';
import { FunctionComponent } from 'preact';
import { useCallback, useMemo } from 'preact/hooks';
import { ComponentView } from './ComponentView';
import { SmartTagsSection } from './Tags/SmartTagsSection';
import { TagsSection } from './Tags/TagsSection';

type Props = {
  application: WebApplication;
};

export const Navigation: FunctionComponent<Props> = observer(
  ({ application }) => {
    const appState = useMemo(() => application.getAppState(), [application]); // TODO: define only one way to do this
    const component = appState.tagsListComponent;
    const enableNativeSmartTagsFeature =
      appState.features.enableNativeSmartTagsFeature;

    const onCreateNewTag = useCallback(() => {
      appState.tags.createNewTemplate();
    }, [appState]);

    return (
      <PremiumModalProvider>
        {/* TODO: move id tags-column to navigation */}
        <div
          id="tags-column"
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
                  <SmartTagsSection
                    application={application}
                    appState={appState}
                  />
                  <TagsSection appState={appState} />
                </div>
              </div>
            </div>
          )}
          {/* <PanelResizer/> */}
        </div>
      </PremiumModalProvider>
    );
  }
);

export const NavigationDirective = toDirective<Props>(Navigation);
