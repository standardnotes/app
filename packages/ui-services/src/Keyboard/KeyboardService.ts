import { Environment, Platform } from '@standardnotes/snjs'
import { eventMatchesKeyAndModifiers } from './eventMatchesKeyAndModifiers'
import { KeyboardCommand } from './KeyboardCommands'
import { KeyboardKeyEvent } from './KeyboardKeyEvent'
import { KeyboardModifier } from './KeyboardModifier'
import { KeyboardCommandHandler } from './KeyboardCommandHandler'
import { KeyboardShortcut, KeyboardShortcutHelpItem, PlatformedKeyboardShortcut } from './KeyboardShortcut'
import { getKeyboardShortcuts } from './getKeyboardShortcuts'

export class KeyboardService {
  readonly activeModifiers = new Set<KeyboardModifier>()
  private commandHandlers = new Set<KeyboardCommandHandler>()
  private commandMap = new Map<KeyboardCommand, KeyboardShortcut>()

  private keyboardShortcutHelpItems = new Set<KeyboardShortcutHelpItem>()

  constructor(
    private platform: Platform,
    environment: Environment,
  ) {
    window.addEventListener('keydown', this.handleKeyDown)
    window.addEventListener('keyup', this.handleKeyUp)
    window.addEventListener('blur', this.handleWindowBlur)

    const shortcuts = getKeyboardShortcuts(platform, environment)
    for (const shortcut of shortcuts) {
      this.registerShortcut(shortcut)
    }
  }

  get isMac() {
    return this.platform === Platform.MacDesktop || this.platform === Platform.MacWeb
  }

  public deinit() {
    this.commandHandlers.clear()
    window.removeEventListener('keydown', this.handleKeyDown)
    window.removeEventListener('keyup', this.handleKeyUp)
    window.removeEventListener('blur', this.handleWindowBlur)
    ;(this.handleKeyDown as unknown) = undefined
    ;(this.handleKeyUp as unknown) = undefined
    ;(this.handleWindowBlur as unknown) = undefined
  }

  private addActiveModifier = (modifier: KeyboardModifier | undefined): void => {
    if (!modifier) {
      return
    }

    switch (modifier) {
      case KeyboardModifier.Meta: {
        if (this.isMac) {
          this.activeModifiers.add(modifier)
        }
        break
      }
      case KeyboardModifier.Ctrl: {
        if (!this.isMac) {
          this.activeModifiers.add(modifier)
        }
        break
      }
      default: {
        this.activeModifiers.add(modifier)
        break
      }
    }
  }

  private removeActiveModifier = (modifier: KeyboardModifier | undefined): void => {
    if (!modifier) {
      return
    }

    this.activeModifiers.delete(modifier)
  }

  public cancelAllKeyboardModifiers = (): void => {
    this.activeModifiers.clear()
  }

  public handleComponentKeyDown = (modifier: KeyboardModifier | undefined): void => {
    this.addActiveModifier(modifier)
  }

  public handleComponentKeyUp = (modifier: KeyboardModifier | undefined): void => {
    this.removeActiveModifier(modifier)
  }

  private handleKeyDown = (event: KeyboardEvent): void => {
    this.updateAllModifiersFromEvent(event)

    this.handleKeyboardEvent(event, KeyboardKeyEvent.Down)
  }

  private handleKeyUp = (event: KeyboardEvent): void => {
    this.updateAllModifiersFromEvent(event)

    this.handleKeyboardEvent(event, KeyboardKeyEvent.Up)
  }

  private updateAllModifiersFromEvent(event: KeyboardEvent): void {
    for (const modifier of Object.values(KeyboardModifier)) {
      if (event.getModifierState(modifier)) {
        this.addActiveModifier(modifier)
      } else {
        this.removeActiveModifier(modifier)
      }
    }
  }

  handleWindowBlur = (): void => {
    for (const modifier of this.activeModifiers) {
      this.activeModifiers.delete(modifier)
    }
  }

  private handleKeyboardEvent(event: KeyboardEvent, keyEvent: KeyboardKeyEvent): void {
    for (const command of this.commandMap.keys()) {
      const shortcut = this.commandMap.get(command)
      if (!shortcut) {
        continue
      }

      if (eventMatchesKeyAndModifiers(event, shortcut)) {
        if (shortcut.preventDefault) {
          event.preventDefault()
        }
        this.handleCommand(command, event, keyEvent)
      }
    }
  }

  private handleCommand(command: KeyboardCommand, event: KeyboardEvent, keyEvent: KeyboardKeyEvent): void {
    const target = event.target as HTMLElement

    for (const observer of Array.from(this.commandHandlers).reverse()) {
      if (observer.command !== command) {
        continue
      }

      if (observer.element && event.target !== observer.element) {
        continue
      }

      if (observer.elements && !observer.elements.includes(target)) {
        continue
      }

      if (observer.notElement && observer.notElement === event.target) {
        continue
      }

      if (observer.notElementIds && observer.notElementIds.includes(target.id)) {
        continue
      }

      if (observer.notTags && observer.notTags.includes(target.tagName)) {
        continue
      }

      const callback = keyEvent === KeyboardKeyEvent.Down ? observer.onKeyDown : observer.onKeyUp
      if (callback) {
        const exclusive = callback(event)
        if (exclusive) {
          return
        }
      }
    }
  }

  public triggerCommand(command: KeyboardCommand, data?: unknown): void {
    for (const observer of Array.from(this.commandHandlers).reverse()) {
      if (observer.command !== command) {
        continue
      }

      const callback = observer.onKeyDown || observer.onKeyUp
      if (callback) {
        const exclusive = callback(new KeyboardEvent('command-trigger'), data)
        if (exclusive) {
          return
        }
      }
    }
  }

  registerShortcut(shortcut: KeyboardShortcut): void {
    this.commandMap.set(shortcut.command, shortcut)
  }

  addCommandHandler(observer: KeyboardCommandHandler): () => void {
    this.commandHandlers.add(observer)

    const helpItem = this.getKeyboardShortcutHelpItemForHandler(observer)
    if (helpItem) {
      const existingItem = Array.from(this.keyboardShortcutHelpItems).find((item) => item.command === helpItem.command)
      if (existingItem) {
        this.keyboardShortcutHelpItems.delete(existingItem)
      }
      this.keyboardShortcutHelpItems.add(helpItem)
    }

    return () => {
      observer.onKeyDown = undefined
      observer.onKeyDown = undefined
      this.commandHandlers.delete(observer)
      if (helpItem) {
        this.keyboardShortcutHelpItems.delete(helpItem)
      }
    }
  }

  addCommandHandlers(handlers: KeyboardCommandHandler[]): () => void {
    const disposers = handlers.map((handler) => this.addCommandHandler(handler))
    return () => {
      for (const disposer of disposers) {
        disposer()
      }
    }
  }

  keyboardShortcutForCommand(command: KeyboardCommand): PlatformedKeyboardShortcut | undefined {
    const shortcut = this.commandMap.get(command)
    if (!shortcut) {
      return undefined
    }

    return {
      platform: this.platform,
      ...shortcut,
    }
  }

  getKeyboardShortcutHelpItemForHandler(handler: KeyboardCommandHandler): KeyboardShortcutHelpItem | undefined {
    const shortcut = this.keyboardShortcutForCommand(handler.command)

    if (!shortcut || !handler.category || !handler.description) {
      return undefined
    }

    return {
      ...shortcut,
      category: handler.category,
      description: handler.description,
    }
  }

  /**
   * Register help item for a keyboard shortcut that is handled outside of the KeyboardService,
   * for example by a library like Lexical.
   */
  registerExternalKeyboardShortcutHelpItem(item: KeyboardShortcutHelpItem): () => void {
    this.keyboardShortcutHelpItems.add(item)

    return () => {
      this.keyboardShortcutHelpItems.delete(item)
    }
  }

  /**
   * Register help item for a keyboard shortcut that is handled outside of the KeyboardService,
   * for example by a library like Lexical.
   */
  registerExternalKeyboardShortcutHelpItems(items: KeyboardShortcutHelpItem[]): () => void {
    const disposers = items.map((item) => this.registerExternalKeyboardShortcutHelpItem(item))

    return () => {
      for (const disposer of disposers) {
        disposer()
      }
    }
  }

  getRegisteredKeyboardShorcutHelpItems(): KeyboardShortcutHelpItem[] {
    return Array.from(this.keyboardShortcutHelpItems)
  }
}
