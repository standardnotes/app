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
    let downloadingToastId = '';

    try {
      const saver = StreamingFileSaver.available()
        ? new StreamingFileSaver(file.nameWithExt)
        : new ClassicFileSaver();

      const isUsingStreamingSaver = saver instanceof StreamingFileSaver;

      if (isUsingStreamingSaver) {
        await saver.selectFileToSaveTo();
      }

      downloadingToastId = addToast({
        type: ToastType.Loading,
        message: `Downloading file...`,
      });

      await this.application.files.downloadFile(
        file,
        async (decryptedBytes: Uint8Array) => {
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

      addToast({
        type: ToastType.Success,
        message: 'Successfully downloaded file',
      });
    } catch (error) {
      console.error(error);

      addToast({
        type: ToastType.Error,
        message: 'There was an error while downloading the file',
      });
    }

    if (downloadingToastId.length > 0) {
      dismissToast(downloadingToastId);
    }
  }

  public async uploadNewFile(fileOrHandle?: File | FileSystemFileHandle) {
    let toastId = '';

    try {
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

      const selectedFile = await picker.selectFile(
        fileOrHandle as File & FileSystemFileHandle
      );

      toastId = addToast({
        type: ToastType.Loading,
        message: `Uploading file "${selectedFile.name}"...`,
      });

      const fileResult = await picker.beginReadingFile();

      const uploadedFile = await this.application.files.finishUpload(
        operation,
        fileResult.name,
        fileResult.ext
      );

      dismissToast(toastId);
      addToast({
        type: ToastType.Success,
        message: `Uploaded file "${uploadedFile.nameWithExt}"`,
      });

      return uploadedFile;
    } catch (error) {
      console.error(error);

      if (toastId.length > 0) {
        dismissToast(toastId);
      }
      addToast({
        type: ToastType.Error,
        message: 'There was an error while uploading the file',
      });
    }
  }
}
