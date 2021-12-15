import { ApplicationEvent } from "@standardnotes/snjs";
import { makeObservable, observable, action, runInAction } from "mobx";
import { WebApplication } from "../application";

export class SearchOptionsState {
  includeProtectedContents = false;
  includeArchived = false;
  includeTrashed = false;

  constructor(
    private application: WebApplication,
    appObservers: (() => void)[]
  ) {
    makeObservable(this, {
      includeProtectedContents: observable,
      includeTrashed: observable,
      includeArchived: observable,

      toggleIncludeArchived: action,
      toggleIncludeTrashed: action,
      toggleIncludeProtectedContents: action,
      refreshIncludeProtectedContents: action,
    });

    appObservers.push(
      this.application.addEventObserver(async () => {
        this.refreshIncludeProtectedContents();
      }, ApplicationEvent.ProtectionSessionExpiryDateChanged)
    );
  }

  toggleIncludeArchived = (): void => {
    this.includeArchived = !this.includeArchived;
  };

  toggleIncludeTrashed = (): void => {
    this.includeTrashed = !this.includeTrashed;
  };

  refreshIncludeProtectedContents = (): void => {
    if (
      this.includeProtectedContents &&
      this.application.areProtectionsEnabled()
    ) {
      this.includeProtectedContents = false;
    }
  };

  toggleIncludeProtectedContents = async (): Promise<void> => {
    if (this.includeProtectedContents) {
      this.includeProtectedContents = false;
    } else {
      const authorized = await this.application.authorizeSearchingProtectedNotesText();
      runInAction(() => {
        this.includeProtectedContents = authorized;
      });
    }
  };
}
