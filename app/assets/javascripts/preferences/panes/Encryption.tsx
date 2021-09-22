import { DecoratedInput } from "@/components/DecoratedInput";
import { Icon } from "@/components/Icon";
import { STRING_E2E_ENABLED, STRING_ENC_NOT_ENABLED, STRING_LOCAL_ENC_ENABLED } from "@/strings";
import { AppState } from "@/ui_models/app_state";
import { observer } from "mobx-react-lite";
import { FunctionComponent } from "preact";
import { PreferencesGroup, PreferencesSegment, Text, Title } from "../components";

const formatCount = (count: number, itemType: string) => `${count} / ${count} ${itemType}`;

const EncryptionEnabled: FunctionComponent<{ appState: AppState }> = observer(({ appState }) => {
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
    <>
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
    </>
  );
});

export const Encryption: FunctionComponent<{ appState: AppState }> = observer(({ appState }) => {
  const app = appState.application;
  const hasUser = app.hasAccount();
  const hasPasscode = app.hasPasscode();
  const isEncryptionEnabled = app.isEncryptionAvailable();

  const encryptionStatusString = hasUser
    ? STRING_E2E_ENABLED
    : hasPasscode
      ? STRING_LOCAL_ENC_ENABLED
      : STRING_ENC_NOT_ENABLED;

  return (
    <PreferencesGroup>
      <PreferencesSegment>
        <Title>Encryption</Title>
        <Text>{encryptionStatusString}</Text>

        {isEncryptionEnabled &&
          <EncryptionEnabled appState={appState} />}
      </PreferencesSegment>
    </PreferencesGroup>
  );
});
