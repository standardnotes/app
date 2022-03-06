import { AppState } from '@/ui_models/app_state';
import { WebApplication } from '@/ui_models/application';
import { observer } from 'mobx-react-lite';
import Bubble from './Bubble';

type Props = {
  appState: AppState;
  application: WebApplication;
};

export const SearchOptions = observer(({ appState }: Props) => {
  const { searchOptions } = appState;

  const { includeProtectedContents, includeArchived, includeTrashed } =
    searchOptions;

  async function toggleIncludeProtectedContents() {
    await searchOptions.toggleIncludeProtectedContents();
  }

  return (
    <div role="tablist" className="search-options justify-between">
      <Bubble
        label="Protected"
        selected={includeProtectedContents}
        onSelect={toggleIncludeProtectedContents}
      />

      <Bubble
        label="Archived"
        selected={includeArchived}
        onSelect={searchOptions.toggleIncludeArchived}
      />

      <Bubble
        label="Trashed"
        selected={includeTrashed}
        onSelect={searchOptions.toggleIncludeTrashed}
      />
    </div>
  );
});
