import { SNAlertService } from "@standardnotes/snjs";

const STORE_NAME = 'items';
const READ_WRITE = 'readwrite';

const OUT_OF_SPACE =
  'Unable to save changes locally because your device is out of space. ' +
  'Please free up some disk space and try again, otherwise, your data may end ' +
  'up in an inconsistent state.';

const DB_DELETION_BLOCKED =
  'Your browser is blocking Standard Notes from deleting the local database. ' +
  'Make sure there are no other open windows of this app and try again. ' +
  'If the issue persists, please manually delete app data to sign out.';

const QUOTE_EXCEEDED_ERROR = 'QuotaExceededError';

export class Database {
  private locked = true
  private db?: IDBDatabase

  constructor(
    public databaseName: string,
    private alertService: SNAlertService) {

  }

  public deinit() {
    (this.alertService as any) = undefined;
    this.db = undefined;
  }

  /**
   * Relinquishes the lock and allows db operations to proceed
   */
  public unlock() {
    this.locked = false;
  }

  /**
   * Opens the database natively, or returns the existing database object if already opened.
   * @param onNewDatabase - Callback to invoke when a database has been created
   * as part of the open process. This can happen on new application sessions, or if the
   * browser deleted the database without the user being aware.
   */
  public async openDatabase(onNewDatabase?: () => void): Promise<IDBDatabase | undefined> {
    if (this.locked) {
      throw Error('Attempting to open locked database');
    }
    if (this.db) {
      return this.db;
    }
    const request = window.indexedDB.open(this.databaseName, 1);
    return new Promise((resolve, reject) => {
      request.onerror = (event) => {
        const target = event!.target! as any;
        if (target.errorCode) {
          this.showAlert('Offline database issue: ' + target.errorCode);
        } else {
          this.displayOfflineAlert();
        }
        reject(new Error('Unable to open db'));
      };
      request.onblocked = (event) => {
        reject(Error('IndexedDB open request blocked'));
      };
      request.onsuccess = (event) => {
        const target = event!.target! as IDBOpenDBRequest;
        const db = target.result;
        db.onversionchange = () => {
          db.close();
        };
        db.onerror = (errorEvent) => {
          const target = errorEvent?.target as any;
          throw Error('Database error: ' + target.errorCode);
        };
        this.db = db;
        resolve(db);
      };
      request.onupgradeneeded = (event) => {
        const target = event!.target! as IDBOpenDBRequest;
        const db = target.result;
        db.onversionchange = () => {
          db.close();
        };
        /* Create an objectStore for this database */
        const objectStore = db.createObjectStore(
          STORE_NAME,
          { keyPath: 'uuid' }
        );
        objectStore.createIndex(
          'uuid',
          'uuid',
          { unique: true }
        );
        objectStore.transaction.oncomplete = () => {
          /* Ready to store values in the newly created objectStore. */
          if (db.version === 1 && onNewDatabase) {
            onNewDatabase && onNewDatabase();
          }
        };
      };
    });
  }

  public async getAllPayloads(): Promise<any[]> {
    const db = (await this.openDatabase())!;
    return new Promise((resolve) => {
      const objectStore =
        db.transaction(STORE_NAME).
          objectStore(STORE_NAME);
      const payloads: any = [];
      const cursorRequest = objectStore.openCursor();
      cursorRequest.onsuccess = (event) => {
        const target = event!.target! as any;
        const cursor = target.result;
        if (cursor) {
          payloads.push(cursor.value);
          cursor.continue();
        } else {
          resolve(payloads);
        }
      };
    });
  }

  public async savePayload(payload: any): Promise<void> {
    return this.savePayloads([payload]);
  }

  public async savePayloads(payloads: any[]): Promise<void> {
    if (payloads.length === 0) {
      return;
    }
    const db = (await this.openDatabase())!;
    const transaction = db.transaction(STORE_NAME, READ_WRITE);
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => { };
      transaction.onerror = (event) => {
        const target = event!.target! as any;
        this.showGenericError(target.error);
      };
      transaction.onabort = (event) => {
        const target = event!.target! as any;
        const error = target.error;
        if (error.name === QUOTE_EXCEEDED_ERROR) {
          this.showAlert(OUT_OF_SPACE);
        } else {
          this.showGenericError(error);
        }
        reject(error);
      };
      const objectStore = transaction.objectStore(STORE_NAME);
      this.putItems(objectStore, payloads).then(resolve);
    });
  }

  private async putItems(objectStore: IDBObjectStore, items: any[]): Promise<void> {
    await Promise.all(items.map((item) => {
      return new Promise((resolve) => {
        const request = objectStore.put(item);
        request.onerror = resolve;
        request.onsuccess = resolve;
      });
    }));
  }

  public async deletePayload(uuid: string): Promise<void> {
    const db = (await this.openDatabase())!;
    return new Promise((resolve, reject) => {
      const request =
        db.transaction(STORE_NAME, READ_WRITE)
          .objectStore(STORE_NAME)
          .delete(uuid);
      request.onsuccess = () => {
        resolve();
      };
      request.onerror = reject;
    });
  }

  public async clearAllPayloads(): Promise<void> {
    const deleteRequest = window.indexedDB.deleteDatabase(this.databaseName);
    return new Promise((resolve, reject) => {
      deleteRequest.onerror = () => {
        reject(Error('Error deleting database.'));
      };
      deleteRequest.onsuccess = () => {
        this.db = undefined;
        resolve();
      };
      deleteRequest.onblocked = (event) => {
        this.showAlert(DB_DELETION_BLOCKED);
        reject(Error('Delete request blocked'));
      };
    });
  }

  private showAlert(message: string) {
    this.alertService!.alert(message);
  }

  private showGenericError(error: { code: number, name: string }) {
    const message =
      `Unable to save changes locally due to an unknown system issue. ` +
      `Issue Code: ${error.code} Issue Name: ${error.name}.`;
    this.showAlert(message);
  }

  private displayOfflineAlert() {
    const message =
      "There was an issue loading your offline database. This could happen for two reasons:" +
      "\n\n1. You're in a private window in your browser. We can't save your data without " +
      "access to the local database. Please use a non-private window." +
      "\n\n2. You have two windows of the app open at the same time. " +
      "Please close any other app instances and reload the page.";
    this.alertService!.alert(message);
  }
}
