import { SNFile } from '@standardnotes/snjs';

export enum PopoverFileItemActionType {
  AttachFileToNote,
  DetachFileToNote,
  DeleteFile,
  DownloadFile,
  RenameFile,
  ToggleFileProtection,
}

export type PopoverFileItemAction =
  | {
      type: Exclude<
        PopoverFileItemActionType,
        | PopoverFileItemActionType.RenameFile
        | PopoverFileItemActionType.ToggleFileProtection
      >;
      payload: SNFile;
    }
  | {
      type: PopoverFileItemActionType.ToggleFileProtection;
      payload: SNFile;
      callback: (isProtected: boolean) => void;
    }
  | {
      type: PopoverFileItemActionType.RenameFile;
      payload: {
        file: SNFile;
        name: string;
      };
    };
