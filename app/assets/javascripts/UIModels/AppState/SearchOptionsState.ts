import { ApplicationEvent } from '@standardnotes/snjs'
import { makeObservable, observable, action, runInAction } from 'mobx'
import { WebApplication } from '../Application'
import { AbstractState } from './AbstractState'

export class SearchOptionsState extends AbstractState {
  includeProtectedContents = false
  includeArchived = false
  includeTrashed = false

  constructor(application: WebApplication, appObservers: (() => void)[]) {
    super(application)

    makeObservable(this, {
      includeProtectedContents: observable,
      includeTrashed: observable,
      includeArchived: observable,

      toggleIncludeArchived: action,
      toggleIncludeTrashed: action,
      toggleIncludeProtectedContents: action,
      refreshIncludeProtectedContents: action,
    })

    appObservers.push(
      this.application.addEventObserver(async () => {
        this.refreshIncludeProtectedContents()
      }, ApplicationEvent.UnprotectedSessionBegan),
      this.application.addEventObserver(async () => {
        this.refreshIncludeProtectedContents()
      }, ApplicationEvent.UnprotectedSessionExpired),
    )
  }

  toggleIncludeArchived = (): void => {
    this.includeArchived = !this.includeArchived
  }

  toggleIncludeTrashed = (): void => {
    this.includeTrashed = !this.includeTrashed
  }

  refreshIncludeProtectedContents = (): void => {
    this.includeProtectedContents = this.application.hasUnprotectedAccessSession()
  }

  toggleIncludeProtectedContents = async (): Promise<void> => {
    if (this.includeProtectedContents) {
      this.includeProtectedContents = false
    } else {
      await this.application.authorizeSearchingProtectedNotesText()
      runInAction(() => {
        this.refreshIncludeProtectedContents()
      })
    }
  }
}
