import { DecoratedInput } from "@/components/DecoratedInput";
import { Icon } from "@/components/Icon";
import { AppState } from "@/ui_models/app_state";
import { observer } from "mobx-react-lite";
import { FunctionComponent } from "preact";
import { PreferencesGroup, PreferencesSegment, Text, Title } from "../components";

const formatCount = (count: number, itemType: string) => `${count} / ${count} ${itemType}`;

export const EndToEndEncryption: FunctionComponent<{ appState: AppState }> = observer(({ appState }) => {
  const count = appState.accountMenu.structuredNotesAndTagsCount;
  const notes = formatCount(count.notes, 'notes');
  const tags = formatCount(count.tags, 'tags');
  const archived = formatCount(count.archived, 'archived notes');
  const deleted = formatCount(count.deleted, 'trashed notes');

  const checkIcon = <Icon className="success min-w-5 min-h-5" type="check-bold" />;
  const noteIcon = <Icon type="rich-text" className="min-w-5 min-h-5" />;
  const tagIcon = <Icon type="hashtag" className="min-w-5 min-h-5" />;
  const archiveIcon = <Icon type="archive" className="min-w-5 min-h-5" />;
  const trashIcon = <Icon type="trash" className="min-w-5 min-h-5" />;
  return (
    <PreferencesGroup>
      <PreferencesSegment>
        <Title>End-to-end encryption</Title>
        <Text>Your data is encrypted before syncing to your private account.</Text>
        <div className="flex flex-row pb-1 pt-1.5" >
          <DecoratedInput disabled={true} text={notes} right={[checkIcon]} left={[noteIcon]} />
          <div className="min-w-3" />
          <DecoratedInput disabled={true} text={tags} right={[checkIcon]} left={[tagIcon]} />
        </div>
        <div className="flex flex-row" >
          <DecoratedInput disabled={true} text={archived} right={[checkIcon]} left={[archiveIcon]} />
          <div className="min-w-3" />
          <DecoratedInput disabled={true} text={deleted} right={[checkIcon]} left={[trashIcon]} />
        </div>
      </PreferencesSegment>
    </PreferencesGroup>
  );
});
