import { FC } from 'react';

type Props = {
  isEncryptionEnabled: boolean;
  notesAndTagsCount: number;
  encryptionStatusString: string | undefined;
}

const Encryption: FC<Props> = ({
                      isEncryptionEnabled,
                      notesAndTagsCount,
                      encryptionStatusString,
                    }) => {
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
}

export default Encryption;
