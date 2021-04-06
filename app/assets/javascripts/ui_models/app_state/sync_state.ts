import { SyncOpStatus } from "@standardnotes/snjs";
import { action, makeObservable, observable } from "mobx";

export class SyncState {
  inProgress = false;
  errorMessage?: string = undefined;
  humanReadablePercentage?: string = undefined;

  constructor() {
    makeObservable(this, {
      inProgress: observable,
      errorMessage: observable,
      humanReadablePercentage: observable,
      update: action,
    });
  }

  update = (status: SyncOpStatus): void => {
    this.errorMessage = status.error?.message;
    this.inProgress = status.syncInProgress;
    const stats = status.getStats();
    const completionPercentage =
      stats.uploadCompletionCount === 0
        ? 0
        : stats.uploadCompletionCount / stats.uploadTotalCount;

    if (completionPercentage === 0) {
      this.humanReadablePercentage = undefined;
    } else {
      this.humanReadablePercentage = completionPercentage.toLocaleString(
        undefined,
        { style: 'percent' }
      );
    }
  }
}
