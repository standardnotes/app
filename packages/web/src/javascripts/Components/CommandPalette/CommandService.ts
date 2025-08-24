import { IconType, UuidGenerator } from '@standardnotes/snjs'

type CommandInfo = {
  description: string
  icon: IconType
}

export class CommandService {
  #commandInfo = new Map<string, CommandInfo>()
  #commandHandlers = new Map<string, () => void>()

  public addCommand(description: string, handler: () => void, icon?: IconType) {
    const id = UuidGenerator.GenerateUuid()
    this.#commandInfo.set(id, { description, icon: icon ?? 'info' })
    this.#commandHandlers.set(id, handler)
    return () => {
      this.#commandInfo.delete(id)
      this.#commandHandlers.delete(id)
    }
  }

  public triggerCommand(id: string) {
    const handler = this.#commandHandlers.get(id)
    if (handler) {
      handler()
    }
  }

  public getCommandDescriptions() {
    const descriptions: ({ id: string } & CommandInfo)[] = []
    for (const [id, { description, icon }] of this.#commandInfo) {
      descriptions.push({ id, description, icon })
    }
    return descriptions
  }
}
