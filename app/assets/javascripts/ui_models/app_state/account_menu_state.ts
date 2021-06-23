import { action, computed, makeObservable, observable, runInAction } from 'mobx';
import { ApplicationEvent, ContentType } from '@standardnotes/snjs';
import { WebApplication } from '@/ui_models/application';
import { SNItem } from '@standardnotes/snjs/dist/@types/models/core/item';

export class AccountMenuState {
  show = false;
  signingOut = false;
  server: string | undefined = undefined;
  notesAndTags: SNItem[] = [];
  isEncryptionEnabled = false;
  encryptionStatusString = '';
  isBackupEncrypted = false;
  showLogin = false;
  showRegister = false;

  constructor(
    private application: WebApplication,
    private appEventListeners: (() => void)[]
  ) {
    makeObservable(this, {
      show: observable,
      signingOut: observable,
      server: observable,
      notesAndTags: observable,
      isEncryptionEnabled: observable,
      encryptionStatusString: observable,
      isBackupEncrypted: observable,
      showLogin: observable,
      showRegister: observable,

      setShow: action,
      toggleShow: action,
      setSigningOut: action,
      setIsEncryptionEnabled: action,
      setEncryptionStatusString: action,
      setIsBackupEncrypted: action,

      notesAndTagsCount: computed
    });

    this.addAppLaunchedEventObserver();
    this.streamNotesAndTags();
  }

  addAppLaunchedEventObserver = (): void => {
    this.appEventListeners.push(
      this.application.addEventObserver(async () => {
        runInAction(() => {
          this.setServer(this.application.getHost());
        });
      }, ApplicationEvent.Launched)
    );
  };

  streamNotesAndTags = (): void => {
    this.appEventListeners.push(
      this.application.streamItems(
        [ContentType.Note, ContentType.Tag],
        () => {
          runInAction(() => {
            this.notesAndTags = this.application.getItems([ContentType.Note, ContentType.Tag]);
          });
        }
      )
    );
  };

  setShow = (show: boolean): void => {
    this.show = show;
  };

  closeAccountMenu = (): void => {
    this.setShow(false);
  };

  setSigningOut = (signingOut: boolean): void => {
    this.signingOut = signingOut;
  };

  setServer = (server: string | undefined): void => {
    this.server = server;
  };

  setIsEncryptionEnabled = (isEncryptionEnabled: boolean): void => {
    this.isEncryptionEnabled = isEncryptionEnabled;
  };

  setEncryptionStatusString = (encryptionStatusString: string): void => {
    this.encryptionStatusString = encryptionStatusString;
  };

  setIsBackupEncrypted = (isBackupEncrypted: boolean): void => {
    this.isBackupEncrypted = isBackupEncrypted;
  };

  setShowLogin = (showLogin: boolean): void => {
    this.showLogin = showLogin;
  };

  setShowRegister = (showRegister: boolean): void => {
    this.showRegister = showRegister;
  };

  toggleShow = (): void => {
    this.show = !this.show;
  };

  get notesAndTagsCount(): number {
    return this.notesAndTags.length;
  }
}
