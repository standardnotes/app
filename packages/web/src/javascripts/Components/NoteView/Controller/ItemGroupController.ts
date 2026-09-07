import { removeFromArray } from '@standardnotes/utils'
import {
  AlertService,
  ComponentManagerInterface,
  FileItem,
  ItemManagerInterface,
  MutatorClientInterface,
  PreferenceServiceInterface,
  SNNote,
  SessionsClientInterface,
  SyncServiceInterface,
} from '@standardnotes/snjs'
import { NoteViewController } from './NoteViewController'
import { FileViewController } from './FileViewController'
import { TemplateNoteViewControllerOptions } from './TemplateNoteViewControllerOptions'
import { IsNativeMobileWeb } from '@standardnotes/ui-services'

type ItemControllerGroupChangeCallback = (activeController: NoteViewController | FileViewController | undefined) => void

export class ItemGroupController {
  public itemControllers: (NoteViewController | FileViewController)[] = []
  changeObservers: ItemControllerGroupChangeCallback[] = []
  eventObservers: (() => void)[] = []

  public activeControllerIndex = 0
  public splitControllerIndex: number | undefined = undefined
  public focusedPane: 'primary' | 'secondary' = 'primary'

  constructor(
    private items: ItemManagerInterface,
    private mutator: MutatorClientInterface,
    private sync: SyncServiceInterface,
    private sessions: SessionsClientInterface,
    private preferences: PreferenceServiceInterface,
    private components: ComponentManagerInterface,
    private alerts: AlertService,
    private _isNativeMobileWeb: IsNativeMobileWeb,
  ) {}

  public deinit(): void {
    ;(this.items as unknown) = undefined

    this.eventObservers.forEach((removeObserver) => {
      removeObserver()
    })

    this.changeObservers.length = 0

    for (const controller of [...this.itemControllers]) {
      this.closeItemController(controller, { notify: false })
    }

    this.itemControllers.length = 0
  }

  async createItemController(
    context: {
      file?: FileItem
      note?: SNNote
      templateOptions?: TemplateNoteViewControllerOptions
    },
    options: { openInNewTab?: boolean; forceNewTab?: boolean } = {}
  ): Promise<NoteViewController | FileViewController> {
    // Check if the item is already open in any existing tab
    if (!options.forceNewTab && (context.note || context.file)) {
      const targetUuid = context.note?.uuid || context.file?.uuid
      const existingIndex = this.itemControllers.findIndex((c) => c.item?.uuid === targetUuid)
      if (existingIndex !== -1) {
        if (this.splitControllerIndex !== undefined && existingIndex === this.splitControllerIndex) {
          this.focusedPane = 'secondary'
        } else {
          this.activeControllerIndex = existingIndex
          this.focusedPane = 'primary'
        }
        this.notifyObservers()
        return this.itemControllers[existingIndex]
      }
    }

    let controller!: NoteViewController | FileViewController

    if (context.file) {
      controller = new FileViewController(context.file, this.items)
    } else if (context.note) {
      controller = new NoteViewController(
        context.note,
        this.items,
        this.mutator,
        this.sync,
        this.sessions,
        this.preferences,
        this.components,
        this.alerts,
        this._isNativeMobileWeb,
      )
    } else if (context.templateOptions) {
      controller = new NoteViewController(
        undefined,
        this.items,
        this.mutator,
        this.sync,
        this.sessions,
        this.preferences,
        this.components,
        this.alerts,
        this._isNativeMobileWeb,
        context.templateOptions,
      )
    } else {
      throw Error('Invalid input to createItemController')
    }

    await controller.initialize()

    const shouldNewTab = options.openInNewTab || this.itemControllers.length === 0

    if (shouldNewTab) {
      this.itemControllers.push(controller)
      if (this.focusedPane === 'secondary' && this.splitControllerIndex !== undefined) {
        this.splitControllerIndex = this.itemControllers.length - 1
      } else {
        this.activeControllerIndex = this.itemControllers.length - 1
        this.focusedPane = 'primary'
      }
    } else {
      const targetIndex = (this.focusedPane === 'secondary' && this.splitControllerIndex !== undefined)
        ? this.splitControllerIndex
        : this.activeControllerIndex

      const oldController = this.itemControllers[targetIndex]
      if (oldController) {
        if (oldController instanceof NoteViewController) {
          oldController.syncOnlyIfLargeNote()
        }
        oldController.deinit()
      }

      this.itemControllers[targetIndex] = controller
    }

    this.notifyObservers()

    return controller
  }

  public selectControllerIndex(index: number): void {
    if (index >= 0 && index < this.itemControllers.length) {
      this.activeControllerIndex = index
      this.focusedPane = 'primary'
      this.notifyObservers()
    }
  }

  public async openNewTemplateTab(): Promise<void> {
    await this.createItemController({
      templateOptions: {
        title: '',
        autofocusBehavior: 'editor',
      }
    }, { openInNewTab: true })
  }

  public splitTab(index: number): void {
    if (index >= 0 && index < this.itemControllers.length) {
      this.splitControllerIndex = index
      this.focusedPane = 'secondary'
      this.notifyObservers()
    }
  }

  public toggleSplitScreen(): void {
    if (this.splitControllerIndex !== undefined) {
      this.splitControllerIndex = undefined
      this.focusedPane = 'primary'
    } else {
      if (this.itemControllers.length > 1) {
        const otherIndex = this.itemControllers.findIndex((_, idx) => idx !== this.activeControllerIndex)
        this.splitControllerIndex = otherIndex !== -1 ? otherIndex : undefined
      } else {
        const currentController = this.itemControllers[this.activeControllerIndex]
        if (currentController) {
          void this.createItemController({
            note: currentController.item instanceof SNNote ? currentController.item : undefined,
            file: currentController.item instanceof FileItem ? currentController.item : undefined,
          }, { openInNewTab: true, forceNewTab: true }).then((newController) => {
            const newIndex = this.itemControllers.indexOf(newController)
            this.splitControllerIndex = newIndex
            this.focusedPane = 'secondary'
            this.notifyObservers()
          })
          return
        }
      }
    }
    this.notifyObservers()
  }

  public closeTab(index: number): void {
    if (index < 0 || index >= this.itemControllers.length) {
      return
    }

    const controller = this.itemControllers[index]
    if (controller instanceof NoteViewController) {
      controller.syncOnlyIfLargeNote()
    }
    controller.deinit()

    this.itemControllers.splice(index, 1)

    if (this.activeControllerIndex >= this.itemControllers.length) {
      this.activeControllerIndex = Math.max(0, this.itemControllers.length - 1)
    }

    if (this.splitControllerIndex !== undefined) {
      if (this.splitControllerIndex === index) {
        this.splitControllerIndex = undefined
        this.focusedPane = 'primary'
      } else if (this.splitControllerIndex > index) {
        this.splitControllerIndex--
      }
    }

    if (this.itemControllers.length === 0) {
      this.activeControllerIndex = 0
      this.splitControllerIndex = undefined
      this.focusedPane = 'primary'
    }

    this.notifyObservers()
  }

  public closeItemController(
    controller: NoteViewController | FileViewController,
    { notify = true }: { notify: boolean } = { notify: true },
  ): void {
    const index = this.itemControllers.indexOf(controller)
    if (index === -1) {
      return
    }

    if (controller instanceof NoteViewController) {
      controller.syncOnlyIfLargeNote()
    }
    controller.deinit()

    this.itemControllers.splice(index, 1)

    if (this.activeControllerIndex >= this.itemControllers.length) {
      this.activeControllerIndex = Math.max(0, this.itemControllers.length - 1)
    }

    if (this.splitControllerIndex !== undefined) {
      if (this.splitControllerIndex === index) {
        this.splitControllerIndex = undefined
        this.focusedPane = 'primary'
      } else if (this.splitControllerIndex > index) {
        this.splitControllerIndex--
      }
    }

    if (this.itemControllers.length === 0) {
      this.activeControllerIndex = 0
      this.splitControllerIndex = undefined
      this.focusedPane = 'primary'
    }

    if (notify) {
      this.notifyObservers()
    }
  }

  closeActiveItemController(): void {
    const activeController = this.activeItemViewController

    if (activeController) {
      this.closeItemController(activeController, { notify: true })
    }
  }

  closeAllItemControllers(): void {
    for (const controller of [...this.itemControllers]) {
      this.closeItemController(controller, { notify: false })
    }

    this.notifyObservers()
  }

  get activeItemViewController(): NoteViewController | FileViewController | undefined {
    if (this.focusedPane === 'secondary' && this.splitControllerIndex !== undefined) {
      return this.itemControllers[this.splitControllerIndex]
    }
    return this.itemControllers[this.activeControllerIndex]
  }

  /**
   * Notifies observer when the active controller has changed.
   */
  public addActiveControllerChangeObserver(callback: ItemControllerGroupChangeCallback): () => void {
    this.changeObservers.push(callback)

    if (this.activeItemViewController) {
      callback(this.activeItemViewController)
    }

    const thislessChangeObservers = this.changeObservers
    return () => {
      removeFromArray(thislessChangeObservers, callback)
    }
  }

  public notifyObservers(): void {
    for (const observer of this.changeObservers) {
      observer(this.activeItemViewController)
    }
  }
}
