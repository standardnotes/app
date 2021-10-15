import { WebApplication } from '@/ui_models/application';
import { AppState } from '@/ui_models/app_state';
import { CollectionSort, PrefKey } from '@standardnotes/snjs';
import { observer } from 'mobx-react-lite';
import { FunctionComponent } from 'preact';
import { useState } from 'preact/hooks';
import { Icon } from './Icon';
import { Switch } from './Switch';
import { toDirective } from './utils';

type Props = {
  appState: AppState;
  application: WebApplication;
};

export const NotesListOptionsMenu: FunctionComponent<Props> = observer(
  ({ application }) => {
    const menuClassName =
      'sn-dropdown sn-dropdown--animated min-w-80 max-w-xs overflow-y-auto \
flex flex-col py-2 bottom-0 left-0 absolute text-sm z-index-dropdown-menu';
    const [sortBy, setSortBy] = useState(() =>
      application.getPreference(PrefKey.SortNotesBy, CollectionSort.CreatedAt)
    );
    const [sortReverse, setSortReverse] = useState(() =>
      application.getPreference(PrefKey.SortNotesReverse, false)
    );
    const [hidePreview, setHidePreview] = useState(() =>
      application.getPreference(PrefKey.NotesHideNotePreview, false)
    );
    const [hideDate, setHideDate] = useState(() =>
      application.getPreference(PrefKey.NotesHideDate, false)
    );
    const [hideTags, setHideTags] = useState(() =>
      application.getPreference(PrefKey.NotesHideTags, true)
    );
    const [hidePinned, setHidePinned] = useState(() =>
      application.getPreference(PrefKey.NotesHidePinned, false)
    );
    const [showArchived, setShowArchived] = useState(() =>
      application.getPreference(PrefKey.NotesShowArchived, false)
    );
    const [showDeleted, setShowDeleted] = useState(() =>
      application.getPreference(PrefKey.NotesShowDeleted, false)
    );
    const [hideProtected, setHideProtected] = useState(() =>
      application.getPreference(PrefKey.NotesHideProtected, false)
    );

    const toggleSortReverse = () => {
      application.setPreference(PrefKey.SortNotesReverse, !sortReverse);
      setSortReverse(!sortReverse);
    };

    const toggleSortBy = (sort: CollectionSort) => {
      if (sortBy === sort) {
        toggleSortReverse();
      } else {
        setSortBy(sort);
        application.setPreference(PrefKey.SortNotesBy, sort);
      }
    };

    const toggleSortByDateModified = () => {
      toggleSortBy(CollectionSort.UpdatedAt);
    };

    const toggleSortByCreationDate = () => {
      toggleSortBy(CollectionSort.CreatedAt);
    };

    const toggleSortByTitle = () => {
      toggleSortBy(CollectionSort.Title);
    };

    const toggleHidePreview = () => {
      setHidePreview(!hidePreview);
      application.setPreference(PrefKey.NotesHideNotePreview, !hidePreview);
    };

    const toggleHideDate = () => {
      setHideDate(!hideDate);
      application.setPreference(PrefKey.NotesHideDate, !hideDate);
    };

    const toggleHideTags = () => {
      setHideTags(!hideTags);
      application.setPreference(PrefKey.NotesHideTags, !hideTags);
    };

    const toggleHidePinned = () => {
      setHidePinned(!hidePinned);
      application.setPreference(PrefKey.NotesHidePinned, !hidePinned);
    };

    const toggleShowArchived = () => {
      setShowArchived(!showArchived);
      application.setPreference(PrefKey.NotesShowArchived, !showArchived);
    };

    const toggleShowDeleted = () => {
      setShowDeleted(!showDeleted);
      application.setPreference(PrefKey.NotesShowDeleted, !showDeleted);
    };

    const toggleHideProtected = () => {
      setHideProtected(!hideProtected);
      application.setPreference(PrefKey.NotesHideProtected, !hideProtected);
    };

    return (
      <div className={menuClassName}>
        <div className="px-3 my-1 text-xs font-semibold color-text uppercase">
          Sort by
        </div>
        <button
          className="sn-dropdown-item py-2 justify-between focus:bg-info-backdrop focus:shadow-none"
          onClick={toggleSortByDateModified}
        >
          <div className="flex items-center">
            <div
              className={`pseudo-radio-btn ${
                sortBy === CollectionSort.UpdatedAt
                  ? 'pseudo-radio-btn--checked'
                  : ''
              } mr-2`}
            ></div>
            <span>Date modified</span>
          </div>
          {sortBy === CollectionSort.UpdatedAt ? (
            sortReverse ? (
              <Icon type="arrows-sort-up" className="color-neutral" />
            ) : (
              <Icon type="arrows-sort-down" className="color-neutral" />
            )
          ) : null}
        </button>
        <button
          className="sn-dropdown-item py-2 justify-between focus:bg-info-backdrop focus:shadow-none"
          onClick={toggleSortByCreationDate}
        >
          <div className="flex items-center">
            <div
              className={`pseudo-radio-btn ${
                sortBy === CollectionSort.CreatedAt
                  ? 'pseudo-radio-btn--checked'
                  : ''
              } mr-2`}
            ></div>
            <span>Creation date</span>
          </div>
          {sortBy === CollectionSort.CreatedAt ? (
            sortReverse ? (
              <Icon type="arrows-sort-up" className="color-neutral" />
            ) : (
              <Icon type="arrows-sort-down" className="color-neutral" />
            )
          ) : null}
        </button>
        <button
          className="sn-dropdown-item py-2 justify-between focus:bg-info-backdrop focus:shadow-none"
          onClick={toggleSortByTitle}
        >
          <div className="flex items-center">
            <div
              className={`pseudo-radio-btn ${
                sortBy === CollectionSort.Title
                  ? 'pseudo-radio-btn--checked'
                  : ''
              } mr-2`}
            ></div>
            <span>Title</span>
          </div>
          {sortBy === CollectionSort.Title ? (
            sortReverse ? (
              <Icon type="arrows-sort-up" className="color-neutral" />
            ) : (
              <Icon type="arrows-sort-down" className="color-neutral" />
            )
          ) : null}
        </button>
        <div className="h-1px my-2 bg-border"></div>
        <div className="px-3 py-1 text-xs font-semibold color-text uppercase">
          View
        </div>
        <Switch
          className="py-1 hover:bg-contrast focus:bg-info-backdrop"
          checked={!hidePreview}
          onChange={toggleHidePreview}
        >
          <div className="flex flex-col max-w-3/4">
            <div className="font-medium">Show note preview</div>
            <p>Turns on previews by default. Can be turned off individually.</p>
          </div>
        </Switch>
        <Switch
          className="py-1 hover:bg-contrast focus:bg-info-backdrop"
          checked={!hideDate}
          onChange={toggleHideDate}
        >
          <div className="font-medium">Show date</div>
        </Switch>
        <Switch
          className="py-1 hover:bg-contrast focus:bg-info-backdrop"
          checked={!hideTags}
          onChange={toggleHideTags}
        >
          <div className="font-medium">Show tags</div>
        </Switch>
        <div className="h-1px my-2 bg-border"></div>
        <div className="px-3 py-1 text-xs font-semibold color-text uppercase">
          Other
        </div>
        <Switch
          className="py-1 hover:bg-contrast focus:bg-info-backdrop"
          checked={!hidePinned}
          onChange={toggleHidePinned}
        >
          <div className="font-medium">Show pinned notes</div>
        </Switch>
        <Switch
          className="py-1 hover:bg-contrast focus:bg-info-backdrop"
          checked={!hideProtected}
          onChange={toggleHideProtected}
        >
          <div className="font-medium">Show protected notes</div>
        </Switch>
        <Switch
          className="py-1 hover:bg-contrast focus:bg-info-backdrop"
          checked={showArchived}
          onChange={toggleShowArchived}
        >
          <div className="font-medium">Show archived notes</div>
        </Switch>
        <Switch
          className="py-1 hover:bg-contrast focus:bg-info-backdrop"
          checked={showDeleted}
          onChange={toggleShowDeleted}
        >
          <div className="font-medium">Show deleted notes</div>
        </Switch>
      </div>
    );
  }
);

export const NotesListOptionsDirective =
  toDirective<Props>(NotesListOptionsMenu);
