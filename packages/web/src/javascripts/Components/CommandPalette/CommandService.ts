import { GenerateUuid, IconType } from '@standardnotes/snjs'
import { KeyboardCommand, KeyboardService, KeyboardShortcutCategory } from '@standardnotes/ui-services'
import mergeRegister from '../../Hooks/mergeRegister'

type CommandInfo = {
  description: string
  icon: IconType
  shortcut_id?: KeyboardCommand
}

type CommandDescription = { id: string } & CommandInfo

export class CommandService {
  #commandInfo = new Map<string, CommandInfo>()
  #commandHandlers = new Map<string, () => void>()

  constructor(
    private keyboardService: KeyboardService,
    private generateUuid: GenerateUuid,
  ) {}

  public add(id: string, description: string, handler: () => void, icon?: IconType, shortcut_id?: KeyboardCommand) {
    this.#commandInfo.set(id, { description, icon: icon ?? 'info', shortcut_id })
    this.#commandHandlers.set(id, handler)
    return () => {
      this.#commandInfo.delete(id)
      this.#commandHandlers.delete(id)
    }
  }

  public addWithShortcut(
    id: KeyboardCommand,
    category: KeyboardShortcutCategory,
    description: string,
    handler: (event?: KeyboardEvent, data?: unknown) => void,
    icon?: IconType,
  ) {
    return mergeRegister(
      this.add(id.description ?? this.generateUuid.execute().getValue(), description, handler, icon, id),
      this.keyboardService.addCommandHandler({ command: id, category, description, onKeyDown: handler }),
    )
  }

  public triggerCommand(id: string) {
    const handler = this.#commandHandlers.get(id)
    if (handler) {
      handler()
    }
  }

  public getCommandDescriptions() {
    const descriptions: CommandDescription[] = []
    for (const [id, { description, icon, shortcut_id }] of this.#commandInfo) {
      descriptions.push({ id, description, icon, shortcut_id })
    }
    return descriptions
  }

  public getCommandDescription(id: string): CommandDescription | undefined {
    const command = this.#commandInfo.get(id)
    if (!command) {
      return
    }
    return { id, ...command }
  }
}
