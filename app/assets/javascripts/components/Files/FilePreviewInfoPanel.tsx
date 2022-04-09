import { formatSizeToReadableString } from '@standardnotes/filepicker';
import { SNFile } from '@standardnotes/snjs';
import { FunctionComponent } from 'preact';
import { Icon } from '../Icon';

type Props = {
  file: SNFile;
};

export const FilePreviewInfoPanel: FunctionComponent<Props> = ({ file }) => {
  return (
    <div className="flex flex-col min-w-70 p-4 border-0 border-l-1px border-solid border-main">
      <div className="flex items-center mb-4">
        <Icon type="info" className="mr-2" />
        <div className="font-semibold">File information</div>
      </div>
      <div className="mb-3">Type: {file.mimeType}</div>
      <div className="mb-3">Size: {formatSizeToReadableString(file.size)}</div>
      <div className="mb-3">Created: {file.created_at.toLocaleString()}</div>
      <div className="mb-3">
        Last Modified: {file.userModifiedDate.toLocaleString()}
      </div>
      <div>File ID: {file.uuid}</div>
    </div>
  );
};
