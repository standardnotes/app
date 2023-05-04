import { ApplicationEvent, InternalEventBus } from '@standardnotes/snjs'
import { makeObservable, observable, action, runInAction } from 'mobx'
import { WebApplication } from '../Application/WebApplication'
import { AbstractViewController } from './Abstract/AbstractViewController'

export class SearchOptionsController extends AbstractViewController {
  includeProtectedContents = false
  includeArchived = false
  includeTrashed = false

  constructor(application: WebApplication, eventBus: InternalEventBus) {
    super(application, eventBus)

    makeObservable(this, {
      includeProtectedContents: observable,
      includeTrashed: observable,
      includeArchived: observable,

      toggleIncludeArchived: action,
      toggleIncludeTrashed: action,
      toggleIncludeProtectedContents: action,
      refreshIncludeProtectedContents: action,
    })

    this.disposers.push(
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
