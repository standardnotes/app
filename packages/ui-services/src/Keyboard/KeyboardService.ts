import { Environment, Platform, PrefDefaults, PrefKey, UuidGenerator } from '@standardnotes/snjs'
import { PreferenceServiceInterface, PreferencesServiceEvent } from '@standardnotes/services'
import { ComponentKeyboardEventInit } from './ComponentKeyboardEventInit'
import { eventMatchesKeyAndModifiers } from './eventMatchesKeyAndModifiers'
import { KeyboardCommand, keyboardCommandForId } from './KeyboardCommands'
import { KeyboardKeyEvent } from './KeyboardKeyEvent'
import { KeyboardModifier } from './KeyboardModifier'
import { KeyboardCommandHandler } from './KeyboardCommandHandler'
import {
  KeyboardShortcut,
  KeyboardShortcutCategory,
  KeyboardShortcutHelpItem,
  PlatformedKeyboardShortcut,
} from './KeyboardShortcut'
import { getKeyboardShortcuts } from './getKeyboardShortcuts'
import { KeyboardShortcutOverrides, sanitizeKeyboardShortcutBinding } from './KeyboardShortcutBinding'

type OverrideLayer = {
  priority: number
  order: number
  overrides: KeyboardShortcutOverrides
}

/** Override layer holding the user's own customizations, from the synced preferences. Takes precedence over other layers. */
const USER_OVERRIDES_LAYER = 'user'
const USER_OVERRIDES_PRIORITY = 100

type HandlerHelpEntry = {
  command: KeyboardCommand
  category: KeyboardShortcutCategory
  description: string
  id: string
}

export class KeyboardService {
  readonly activeModifiers = new Set<KeyboardModifier>()
  private commandHandlers = new Set<KeyboardCommandHandler>()

  /** Built-in bindings, before any overrides are applied. */
  private defaultShortcuts = new Map<KeyboardCommand, KeyboardShortcut>()
  /** Named sets of overrides (e.g. 'user', or a plugin id), applied on top of the defaults. */
  private overrideLayers = new Map<string, OverrideLayer>()
  private overrideLayerCounter = 0
  /** Effective bindings: defaults with all override layers applied. Unbound commands are absent. */
  private commandMap = new Map<KeyboardCommand, KeyboardShortcut>()
  private shortcutChangeObservers = new Set<() => void>()
  private removePreferencesObserver: () => void

  private handlerHelpEntries = new Set<HandlerHelpEntry>()
  private keyboardShortcutHelpItems = new Set<KeyboardShortcutHelpItem>()

  constructor(
    private platform: Platform,
    environment: Environment,
    private preferences: PreferenceServiceInterface,
  ) {
    window.addEventListener('keydown', this.handleKeyDown)
    window.addEventListener('keyup', this.handleKeyUp)
    window.addEventListener('blur', this.handleWindowBlur)

    const shortcuts = getKeyboardShortcuts(platform, environment)
    for (const shortcut of shortcuts) {
      this.defaultShortcuts.set(shortcut.command, shortcut)
    }

    this.applyUserOverrides(false)
    this.removePreferencesObserver = preferences.addEventObserver(async (event) => {
      if (event === PreferencesServiceEvent.PreferencesChanged) {
        this.applyUserOverrides()
      }
    })
  }

  private applyUserOverrides(notify = true): void {
    const overrides = this.preferences.getValue(
      PrefKey.KeyboardShortcutOverrides,
      PrefDefaults[PrefKey.KeyboardShortcutOverrides],
    )
    this.overrideLayers.set(USER_OVERRIDES_LAYER, {
      priority: USER_OVERRIDES_PRIORITY,
      order: this.overrideLayers.get(USER_OVERRIDES_LAYER)?.order ?? this.overrideLayerCounter++,
      overrides: { ...overrides },
    })
    this.rebuildCommandMap(notify)
  }

  private isDisabled = false
  /**
   * When called, the service will stop triggering command handlers
   * on keydown/keyup events. Useful when you need to handle events
   * yourself while keeping the rest of behaviours inert.
   * Make sure to call {@link enableEventHandling} once done.
   */
  public disableEventHandling() {
    this.isDisabled = true
  }
  public enableEventHandling() {
    this.isDisabled = false
  }

  get isMac() {
    return this.platform === Platform.MacDesktop || this.platform === Platform.MacWeb
  }

  public deinit() {
    this.removePreferencesObserver()
    ;(this.preferences as unknown) = undefined
    this.commandHandlers.clear()
    this.shortcutChangeObservers.clear()
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

  public handleComponentKeyboardEvent = (eventInit: ComponentKeyboardEventInit, keyEvent: KeyboardKeyEvent): void => {
    const event = new KeyboardEvent(keyEvent === KeyboardKeyEvent.Down ? 'keydown' : 'keyup', eventInit)
    this.updateAllModifiersFromEvent(event)
    this.handleKeyboardEvent(event, keyEvent)
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
    if (this.isDisabled) {
      return
    }
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

  /**
   * Registers or replaces the default binding for a command. Active overrides still take precedence.
   */
  registerShortcut(shortcut: KeyboardShortcut): void {
    this.defaultShortcuts.set(shortcut.command, shortcut)
    this.rebuildCommandMap()
  }

  /**
   * Sets a named layer of shortcut overrides, replacing any previous overrides for that layer.
   * Layers with a higher priority win; layers with equal priority are applied in the order they were first set.
   * Unknown command ids and invalid bindings are ignored.
   *
   * The user's own overrides are read from the synced preferences, with priority 100.
   *
   * @param layerId Identifies the source of the overrides, e.g. a plugin identifier.
   */
  setShortcutOverrides(layerId: string, overrides: KeyboardShortcutOverrides, priority = 0): void {
    if (layerId === USER_OVERRIDES_LAYER) {
      throw new Error(`Shortcut override layer '${USER_OVERRIDES_LAYER}' is reserved for user preferences`)
    }

    this.overrideLayers.set(layerId, {
      priority,
      order: this.overrideLayers.get(layerId)?.order ?? this.overrideLayerCounter++,
      overrides: { ...overrides },
    })
    this.rebuildCommandMap()
  }

  removeShortcutOverrides(layerId: string): void {
    if (layerId !== USER_OVERRIDES_LAYER && this.overrideLayers.delete(layerId)) {
      this.rebuildCommandMap()
    }
  }

  /**
   * Called whenever the effective shortcuts change, e.g. when overrides are set or removed.
   * Use this to refresh any displayed shortcut labels.
   */
  addShortcutChangeObserver(observer: () => void): () => void {
    this.shortcutChangeObservers.add(observer)
    return () => {
      this.shortcutChangeObservers.delete(observer)
    }
  }

  private rebuildCommandMap(notify = true): void {
    const commandMap = new Map(this.defaultShortcuts)

    const layers = Array.from(this.overrideLayers.values()).sort((a, b) => a.priority - b.priority || a.order - b.order)

    for (const layer of layers) {
      for (const [commandId, binding] of Object.entries(layer.overrides)) {
        const command = keyboardCommandForId(commandId)
        if (!command) {
          continue
        }

        if (binding === null) {
          commandMap.delete(command)
          continue
        }

        const cleanBinding = sanitizeKeyboardShortcutBinding(binding)
        if (!cleanBinding) {
          continue
        }

        commandMap.set(command, {
          ...cleanBinding,
          command,
          preventDefault: cleanBinding.preventDefault ?? this.defaultShortcuts.get(command)?.preventDefault,
        })
      }
    }

    this.commandMap = commandMap

    if (notify) {
      for (const observer of Array.from(this.shortcutChangeObservers)) {
        observer()
      }
    }
  }

  addCommandHandler(observer: KeyboardCommandHandler): () => void {
    this.commandHandlers.add(observer)

    let helpEntry: HandlerHelpEntry | undefined
    if (observer.category && observer.description) {
      helpEntry = {
        command: observer.command,
        category: observer.category,
        description: observer.description,
        id: UuidGenerator.GenerateUuid(),
      }
      for (const existingEntry of this.handlerHelpEntries) {
        if (existingEntry.command === observer.command) {
          this.handlerHelpEntries.delete(existingEntry)
        }
      }
      this.handlerHelpEntries.add(helpEntry)
    }

    return () => {
      observer.onKeyDown = undefined
      observer.onKeyUp = undefined
      this.commandHandlers.delete(observer)
      if (helpEntry) {
        this.handlerHelpEntries.delete(helpEntry)
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

  /** The built-in binding for a command, ignoring any overrides. */
  defaultKeyboardShortcutForCommand(command: KeyboardCommand): KeyboardShortcut | undefined {
    return this.defaultShortcuts.get(command)
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

  /**
   * Register help item for a keyboard shortcut that is handled outside of the KeyboardService,
   * for example by a library like Lexical.
   */
  registerExternalKeyboardShortcutHelpItem(item: Omit<KeyboardShortcutHelpItem, 'id'>): () => void {
    const itemWithId = { ...item, id: UuidGenerator.GenerateUuid() }
    this.keyboardShortcutHelpItems.add(itemWithId)

    return () => {
      this.keyboardShortcutHelpItems.delete(itemWithId)
    }
  }

  /**
   * Register help item for a keyboard shortcut that is handled outside of the KeyboardService,
   * for example by a library like Lexical.
   */
  registerExternalKeyboardShortcutHelpItems(items: Omit<KeyboardShortcutHelpItem, 'id'>[]): () => void {
    const disposers = items.map((item) => this.registerExternalKeyboardShortcutHelpItem(item))

    return () => {
      for (const disposer of disposers) {
        disposer()
      }
    }
  }

  /**
   * @param options.includeUnbound Also return items for commands that currently have no binding
   * (e.g. unbound by an override), without key or modifiers. Useful for shortcut editing UI.
   */
  getRegisteredKeyboardShorcutHelpItems(options?: { includeUnbound?: boolean }): KeyboardShortcutHelpItem[] {
    const handlerItems: KeyboardShortcutHelpItem[] = []
    for (const entry of this.handlerHelpEntries) {
      const shortcut = this.keyboardShortcutForCommand(entry.command)
      if (shortcut) {
        handlerItems.push({ ...shortcut, ...entry })
      } else if (options?.includeUnbound) {
        handlerItems.push({ platform: this.platform, ...entry })
      }
    }

    return [...handlerItems, ...Array.from(this.keyboardShortcutHelpItems)]
  }
}
