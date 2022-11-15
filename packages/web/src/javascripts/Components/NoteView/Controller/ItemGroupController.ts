import { WebApplication } from '@/Application/Application'
import { removeFromArray } from '@standardnotes/utils'
import { FileItem, SNNote } from '@standardnotes/snjs'
import { NoteViewController } from './NoteViewController'
import { FileViewController } from './FileViewController'
import { TemplateNoteViewControllerOptions } from './TemplateNoteViewControllerOptions'

type ItemControllerGroupChangeCallback = (activeController: NoteViewController | FileViewController | undefined) => void

export class ItemGroupController {
  public itemControllers: (NoteViewController | FileViewController)[] = []
  changeObservers: ItemControllerGroupChangeCallback[] = []
  eventObservers: (() => void)[] = []

  constructor(private application: WebApplication) {}

  public deinit(): void {
    ;(this.application as unknown) = undefined

    this.eventObservers.forEach((removeObserver) => {
      removeObserver()
    })

    this.changeObservers.length = 0

    for (const controller of this.itemControllers) {
      this.closeItemController(controller, { notify: false })
    }

    this.itemControllers.length = 0
  }

  async createItemController(context: {
    file?: FileItem
    note?: SNNote
    templateOptions?: TemplateNoteViewControllerOptions
  }): Promise<NoteViewController | FileViewController> {
    if (this.activeItemViewController) {
      this.closeItemController(this.activeItemViewController, { notify: false })
    }

    let controller!: NoteViewController | FileViewController

    if (context.file) {
      controller = new FileViewController(this.application, context.file)
    } else if (context.note) {
      controller = new NoteViewController(this.application, context.note)
    } else if (context.templateOptions) {
      controller = new NoteViewController(this.application, undefined, context.templateOptions)
    } else {
      throw Error('Invalid input to createItemController')
    }

    this.itemControllers.push(controller)

    await controller.initialize()

    this.notifyObservers()

    return controller
  }

  public closeItemController(
    controller: NoteViewController | FileViewController,
    { notify = true }: { notify: boolean } = { notify: true },
  ): void {
    controller.deinit()

    removeFromArray(this.itemControllers, controller)

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
    for (const controller of this.itemControllers) {
      this.closeItemController(controller, { notify: false })
    }

    this.notifyObservers()
  }

  get activeItemViewController(): NoteViewController | FileViewController | undefined {
    return this.itemControllers[0]
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

  private notifyObservers(): void {
    for (const observer of this.changeObservers) {
      observer(this.activeItemViewController)
    }
  }
}
