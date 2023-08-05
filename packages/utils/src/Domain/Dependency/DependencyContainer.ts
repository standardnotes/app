import { isNotUndefined } from '../Utils/Utils'
import { isDeinitable } from './isDeinitable'

export class DependencyContainer {
  private factory = new Map<symbol, () => unknown>()
  private dependencies = new Map<symbol, unknown>()

  public deinit() {
    this.factory.clear()

    const deps = this.getAll()
    for (const dep of deps) {
      if (isDeinitable(dep)) {
        dep.deinit()
      }
    }

    this.dependencies.clear()
  }

  public getAll(): unknown[] {
    return Array.from(this.dependencies.values()).filter(isNotUndefined)
  }

  public bind<T>(sym: symbol, maker: () => T) {
    this.factory.set(sym, maker)
  }

  public get<T>(sym: symbol): T {
    const dep = this.dependencies.get(sym)
    if (dep) {
      return dep as T
    }

    const maker = this.factory.get(sym)
    if (!maker) {
      throw new Error(`No dependency maker found for ${sym.toString()}`)
    }

    const instance = maker()
    if (!instance) {
      /** Could be optional */
      return undefined as T
    }

    this.dependencies.set(sym, instance)

    return instance as T
  }
}
