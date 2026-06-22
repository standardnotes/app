import { ProtectionsClientInterface } from '@standardnotes/services'
import {
  ApplicationEvent,
  InternalEventBusInterface,
  InternalEventHandlerInterface,
  InternalEventInterface,
  SNTag,
} from '@standardnotes/snjs'
import { makeObservable, observable, action, runInAction, computed } from 'mobx'
import { AbstractViewController } from './Abstract/AbstractViewController'

export class SearchOptionsController extends AbstractViewController implements InternalEventHandlerInterface {
  includeProtectedContents = false
  includeArchived = false
  includeTrashed = false
  noteTitleOnly = false
  tagFilterList: SNTag[] = []

  constructor(
    private protections: ProtectionsClientInterface,
    eventBus: InternalEventBusInterface,
  ) {
    super(eventBus)

    makeObservable(this, {
      includeProtectedContents: observable,
      includeTrashed: observable,
      includeArchived: observable,
      noteTitleOnly: observable,
      tagFilterList: observable,

      toggleIncludeArchived: action,
      toggleIncludeTrashed: action,
      toggleIncludeProtectedContents: action,
      refreshIncludeProtectedContents: action,
      setNoteTitleOnly: action,
      addTagFilter: action,
      removeTagFilter: action,
      clearTagFilters: action,
      clearAllFilters: action,

      activeSearchFilterCount: computed,
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

  setNoteTitleOnly = (value: boolean): void => {
    this.noteTitleOnly = value
  }

  addTagFilter = (tag: SNTag): void => {
    if (!this.tagFilterList.some((existing) => existing.uuid === tag.uuid)) {
      this.tagFilterList = [...this.tagFilterList, tag]
    }
  }

  removeTagFilter = (tag: SNTag): void => {
    this.tagFilterList = this.tagFilterList.filter((existing) => existing.uuid !== tag.uuid)
  }

  clearTagFilters = (): void => {
    this.tagFilterList = []
  }

  clearAllFilters = (): void => {
    this.noteTitleOnly = false
    this.includeArchived = false
    this.includeTrashed = false
    this.includeProtectedContents = false
    this.tagFilterList = []
  }

  get activeSearchFilterCount(): number {
    return (
      Number(this.noteTitleOnly) +
      Number(this.includeProtectedContents) +
      Number(this.includeArchived) +
      Number(this.includeTrashed) +
      this.tagFilterList.length
    )
  }
}
