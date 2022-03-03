import {
  ClassicFileReader,
  StreamingFileReader,
  StreamingFileSaver,
} from '@standardnotes/filepicker';
import { SNFile } from '@standardnotes/snjs';
import { addToast, dismissToast, ToastType } from '@standardnotes/stylekit';

import { WebApplication } from '../application';

export class FilesState {
  constructor(private application: WebApplication) {}

  public async downloadFile(file: SNFile): Promise<void> {
    console.log('Downloading file', file.nameWithExt);
    const saver = new StreamingFileSaver(file.nameWithExt);
    await saver.selectFileToSaveTo();

    await this.application.files.downloadFile(
      file,
      async (decryptedBytes: Uint8Array) => {
        console.log(`Pushing ${decryptedBytes.length} decrypted bytes to disk`);
        await saver.pushBytes(decryptedBytes);
      }
    );
    await saver.finish();
  }

  public async uploadNewFile(): Promise<void> {
    const operation = await this.application.files.beginNewFileUpload();
    const minimumChunkSize = this.application.files.minimumChunkSize();

    const onChunk = async (
      chunk: Uint8Array,
      index: number,
      isLast: boolean
    ) => {
      await this.application.files.pushBytesForUpload(
        operation,
        chunk,
        index,
        isLast
      );
    };

    const picker = StreamingFileReader.available()
      ? new StreamingFileReader(minimumChunkSize, onChunk)
      : new ClassicFileReader(minimumChunkSize, onChunk);

    const selectedFile = await picker.selectFile();

    const uploadingToastId = addToast({
      type: ToastType.Loading,
      message: `Uploading file ${selectedFile.name}`,
    });

    const fileResult = await picker.beginReadingFile();

    this.application.files
      .finishUpload(operation, fileResult.name, fileResult.ext)
      .then((file: SNFile) => {
        addToast({
          type: ToastType.Success,
          message: `Uploaded file ${file.nameWithExt},`,
        });
      })
      .catch((err) => {
        console.error(err);
        addToast({
          type: ToastType.Error,
          message: err.message ?? err.toString(),
        });
      })
      .finally(() => {
        dismissToast(uploadingToastId);
      });
  }
}
