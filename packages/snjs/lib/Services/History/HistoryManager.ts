import { removeFromArray } from '@standardnotes/utils'
import { ItemManager } from '@Lib/Services/Items/ItemManager'
import { DiskStorageService } from '@Lib/Services/Storage/DiskStorageService'
import { UuidString } from '../../Types/UuidString'
import * as Models from '@standardnotes/models'
import { SNNote } from '@standardnotes/models'
import {
  AbstractService,
  DeviceInterface,
  HistoryServiceInterface,
  InternalEventBusInterface,
} from '@standardnotes/services'
import { ContentType } from '@standardnotes/domain-core'

/** The amount of revisions per item above which should call for an optimization. */
const DefaultItemRevisionsThreshold = 20

/**
 * The amount of characters added or removed that
 * constitute a keepable entry after optimization.
 */
const LargeEntryDeltaThreshold = 25

/**
 * The history manager is responsible for:
 * 1. Transient session history, which include keeping track of changes made in the
 *    current application session. These change logs (unless otherwise configured) are
 *    ephemeral and do not persist past application restart. Session history entries are
 *    added via change observers that trigger when an item changes.
 * 2. Remote server history. Entries are automatically added by the server and must be
 *    retrieved per item via an API call.
 */
export class HistoryManager extends AbstractService implements HistoryServiceInterface {
  private removeChangeObserver: () => void

  /**
   * When no history exists for an item yet, we first put it in the staging map.
   * Then, the next time the item changes and it has no history, we check the staging map.
   * If the entry from the staging map differs from the incoming change, we now add the incoming
   * change to the history map and remove it from staging. This is a way to detect when the first
   * actual change of an item occurs (especially new items), rather than tracking a change
   * as an item propagating through the different PayloadSource
   * lifecycles (created, local saved, presyncsave, etc)
   */
  private historyStaging: Partial<Record<UuidString, Models.HistoryEntry>> = {}
  private history: Models.HistoryMap = {}
  private itemRevisionThreshold = DefaultItemRevisionsThreshold

  constructor(
    private itemManager: ItemManager,
    private storageService: DiskStorageService,
    public deviceInterface: DeviceInterface,
    protected override internalEventBus: InternalEventBusInterface,
  ) {
    super(internalEventBus)
    this.removeChangeObserver = this.itemManager.addObserver(ContentType.TYPES.Note, ({ changed, inserted }) => {
      this.recordNewHistoryForItems(changed.concat(inserted) as SNNote[])
    })
  }

  public override deinit(): void {
    ;(this.itemManager as unknown) = undefined
    ;(this.storageService as unknown) = undefined
    ;(this.history as unknown) = undefined
    if (this.removeChangeObserver) {
      this.removeChangeObserver()
      ;(this.removeChangeObserver as unknown) = undefined
    }
    super.deinit()
  }

  private recordNewHistoryForItems(items: Models.SNNote[]) {
    for (const item of items) {
      const itemHistory = this.history[item.uuid] || []
      const latestEntry = Models.historyMapFunctions.getNewestRevision(itemHistory)
      const historyPayload = new Models.DecryptedPayload<Models.NoteContent>(item.payload)

      const currentValueEntry = Models.CreateHistoryEntryForPayload(historyPayload, latestEntry)
      if (currentValueEntry.isDiscardable()) {
        continue
      }

      /**
       * For every change that comes in, first add it to the staging area.
       * Then, only on the next subsequent change do we add this previously
       * staged entry
       */
      const stagedEntry = this.historyStaging[item.uuid]

      /** Add prospective to staging, and consider now adding previously staged as new revision */
      this.historyStaging[item.uuid] = currentValueEntry

      if (!stagedEntry) {
        continue
      }

      if (stagedEntry.isSameAsEntry(currentValueEntry)) {
        continue
      }

      if (latestEntry && stagedEntry.isSameAsEntry(latestEntry)) {
        continue
      }

      itemHistory.unshift(stagedEntry)
      this.history[item.uuid] = itemHistory

      this.optimizeHistoryForItem(item.uuid)
    }
  }

  sessionHistoryForItem(item: Models.SNNote): Models.HistoryEntry[] {
    return this.history[item.uuid] || []
  }

  getHistoryMapCopy(): Models.HistoryMap {
    const copy = Object.assign({}, this.history)
    for (const [key, value] of Object.entries(copy)) {
      copy[key] = value.slice()
    }
    return Object.freeze(copy)
  }

  /**
   * Clean up if there are too many revisions. Note itemRevisionThreshold
   * is the amount of revisions which above, call for an optimization. An
   * optimization may not remove entries above this threshold. It will
   * determine what it should keep and what it shouldn't. So, it is possible
   * to have a threshold of 60 but have 600 entries, if the item history deems
   * those worth keeping.
   *
   * Rules:
   * - Keep an entry if it is the oldest entry
   * - Keep an entry if it is the latest entry
   * - Keep an entry if it is Significant
   * - If an entry is Significant and it is a deletion change, keep the entry before this entry.
   */
  optimizeHistoryForItem(uuid: string): void {
    const entries = this.history[uuid] || []
    if (entries.length <= this.itemRevisionThreshold) {
      return
    }

    const isEntrySignificant = (entry: Models.HistoryEntry) => {
      return entry.deltaSize() > LargeEntryDeltaThreshold
    }
    const keepEntries: Models.HistoryEntry[] = []
    const processEntry = (entry: Models.HistoryEntry, index: number, keep: boolean) => {
      /**
       * Entries may be processed retrospectively, meaning it can be
       * decided to be deleted, then an upcoming processing can change that.
       */
      if (keep) {
        keepEntries.unshift(entry)
        if (isEntrySignificant(entry) && entry.operationVector() === -1) {
          /** This is a large negative change. Hang on to the previous entry. */
          const previousEntry = entries[index + 1]
          if (previousEntry) {
            keepEntries.unshift(previousEntry)
          }
        }
      } else {
        /** Don't keep, remove if in keep */
        removeFromArray(keepEntries, entry)
      }
    }
    for (let index = entries.length - 1; index >= 0; index--) {
      const entry = entries[index]
      const isSignificant = index === 0 || index === entries.length - 1 || isEntrySignificant(entry)
      processEntry(entry, index, isSignificant)
    }
    const filtered = entries.filter((entry) => {
      return keepEntries.includes(entry)
    })
    this.history[uuid] = filtered
  }
}
