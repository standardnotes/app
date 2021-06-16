import { AppState } from '@/ui_models/app_state';
import { observer } from 'mobx-react-lite';

type Props = {
  appState: AppState;
  notesAndTagsCount: number;
}

const Encryption = observer(({
                               appState,
                               notesAndTagsCount
                             }: Props) => {
  const { isEncryptionEnabled, encryptionStatusString } = appState.accountMenu;

  const getEncryptionStatusForNotes = () => {
    const length = notesAndTagsCount;
    return `${length}/${length} notes and tags encrypted`;
  };

  return (
    <div className="sk-panel-section">
      <div className="sk-panel-section-title">
        Encryption
      </div>
      {isEncryptionEnabled && (
        <div className="sk-panel-section-subtitle info">
          {getEncryptionStatusForNotes()}
        </div>
      )}
      <p className="sk-p">
        {encryptionStatusString}
      </p>
    </div>
  );
});

export default Encryption;
