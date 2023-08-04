import { ProtectionsClientInterface } from '@standardnotes/services'
import {
  ApplicationEvent,
  InternalEventBusInterface,
  InternalEventHandlerInterface,
  InternalEventInterface,
} from '@standardnotes/snjs'
import { makeObservable, observable, action, runInAction } from 'mobx'
import { AbstractViewController } from './Abstract/AbstractViewController'

export class SearchOptionsController extends AbstractViewController implements InternalEventHandlerInterface {
  includeProtectedContents = false
  includeArchived = false
  includeTrashed = false

  constructor(
    private protections: ProtectionsClientInterface,
    eventBus: InternalEventBusInterface,
  ) {
    super(eventBus)

    makeObservable(this, {
      includeProtectedContents: observable,
      includeTrashed: observable,
      includeArchived: observable,

      toggleIncludeArchived: action,
      toggleIncludeTrashed: action,
      toggleIncludeProtectedContents: action,
      refreshIncludeProtectedContents: action,
    })

    eventBus.addEventHandler(this, ApplicationEvent.UnprotectedSessionBegan)
    eventBus.addEventHandler(this, ApplicationEvent.UnprotectedSessionExpired)
  }

  async handleEvent(event: InternalEventInterface): Promise<void> {
    if (event.type === ApplicationEvent.UnprotectedSessionBegan) {
      this.refreshIncludeProtectedContents()
    } else if (event.type === ApplicationEvent.UnprotectedSessionExpired) {
      this.refreshIncludeProtectedContents()
    }
  }

  toggleIncludeArchived = (): void => {
    this.includeArchived = !this.includeArchived
  }

  toggleIncludeTrashed = (): void => {
    this.includeTrashed = !this.includeTrashed
  }

  refreshIncludeProtectedContents = (): void => {
    this.includeProtectedContents = this.protections.hasUnprotectedAccessSession()
  }

  toggleIncludeProtectedContents = async (): Promise<void> => {
    if (this.includeProtectedContents) {
      this.includeProtectedContents = false
    } else {
      await this.protections.authorizeSearchingProtectedNotesText()
      runInAction(() => {
        this.refreshIncludeProtectedContents()
      })
    }
  }
}
