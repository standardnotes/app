import { PremiumModalProvider } from '@/components/Premium';
import { toDirective } from '@/components/utils';
import { AppState } from '@/ui_models/app_state';
import { isMobile } from '@/utils';
import { observer } from 'mobx-react-lite';
import { FunctionComponent } from 'preact';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';
import { RootTagDropZone } from './RootTagDropZone';
import { TagsListItem } from './TagsListItem';

type Props = {
  appState: AppState;
};

export const TagsList: FunctionComponent<Props> = observer(({ appState }) => {
  const tagsState = appState.tags;
  const allTags = tagsState.allLocalRootTags;

  const backend = isMobile({ tablet: true }) ? TouchBackend : HTML5Backend;

  return (
    <PremiumModalProvider>
      <DndProvider backend={backend}>
        {allTags.length === 0 ? (
          <div className="no-tags-placeholder">
            No tags. Create one using the add button above.
          </div>
        ) : (
          <>
            {allTags.map((tag) => {
              return (
                <TagsListItem
                  level={0}
                  key={tag.uuid}
                  tag={tag}
                  tagsState={tagsState}
                  features={appState.features}
                />
              );
            })}
            <RootTagDropZone
              tagsState={appState.tags}
              featuresState={appState.features}
            />
          </>
        )}
      </DndProvider>
    </PremiumModalProvider>
  );
});

export const TagsListDirective = toDirective<Props>(TagsList);
