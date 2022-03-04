import {
  ClassicFileReader,
  StreamingFileReader,
  StreamingFileSaver,
  ClassicFileSaver,
} from '@standardnotes/filepicker';
import { SNFile } from '@standardnotes/snjs';
import { addToast, dismissToast, ToastType } from '@standardnotes/stylekit';

import { WebApplication } from '../application';

export class FilesState {
  constructor(private application: WebApplication) {}

  public async downloadFile(file: SNFile): Promise<void> {
    console.log('Downloading file', file.nameWithExt);

    const saver = StreamingFileSaver.available()
      ? new StreamingFileSaver(file.nameWithExt)
      : new ClassicFileSaver();

    const isUsingStreamingSaver = saver instanceof StreamingFileSaver;

    let downloadingToastId = '';

    addToast({
      type: ToastType.Regular,
      message: `Starting download...`,
    });

    try {
      if (isUsingStreamingSaver) {
        await saver.selectFileToSaveTo();

        downloadingToastId = addToast({
          type: ToastType.Loading,
          message: `Downloading file...`,
        });
      }

      await this.application.files.downloadFile(
        file,
        async (decryptedBytes: Uint8Array) => {
          console.log(
            `Pushing ${decryptedBytes.length} decrypted bytes to disk`
          );

          if (isUsingStreamingSaver) {
            await saver.pushBytes(decryptedBytes);
          } else {
            saver.saveFile(file.nameWithExt, decryptedBytes);
          }
        }
      );

      if (isUsingStreamingSaver) {
        await saver.finish();
      }
    } catch (error) {
      console.error(error);

      addToast({
        type: ToastType.Error,
        message: (error as Error).message ?? (error as Error).toString(),
      });
    }

    if (downloadingToastId.length > 0) {
      dismissToast(downloadingToastId);
    }
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
      message: `Uploading file "${selectedFile.name}"...`,
    });

    const fileResult = await picker.beginReadingFile();

    try {
      const uploadedFile = await this.application.files.finishUpload(
        operation,
        fileResult.name,
        fileResult.ext
      );

      addToast({
        type: ToastType.Success,
        message: `Uploaded file "${uploadedFile.nameWithExt}"`,
      });
    } catch (error) {
      console.error(error);

      addToast({
        type: ToastType.Error,
        message: (error as Error).message ?? (error as Error).toString(),
      });
    }

    dismissToast(uploadingToastId);
  }
}
