import fs from 'fs'
import path from 'path'
import { MessageType } from '../../../../test/TestIpcMessage'
import { handleTestMessage } from '../Utils/Testing'
import { isTesting } from '../Utils/Utils'
import { parseDataFile, serializeStoreData } from './createSanitizedStoreData'
import { StoreData } from './StoreKeys'

export const app = process.type === 'browser' ? require('electron').app : require('@electron/remote').app

export function logError(...message: any) {
  console.error('store:', ...message)
}

export class Store {
  static instance: Store
  readonly path: string
  readonly data: StoreData

  static getInstance(): Store {
    if (!this.instance) {
      const userDataPath = app.getPath('userData')
      this.instance = new Store(userDataPath)
    }
    return this.instance
  }

  static get<T extends keyof StoreData>(key: T): StoreData[T] {
    return this.getInstance().get(key)
  }

  constructor(userDataPath: string) {
    this.path = path.join(userDataPath, 'user-preferences.json')
    this.data = parseDataFile(this.path)

    if (isTesting()) {
      handleTestMessage(MessageType.StoreSettingsLocation, () => this.path)
      handleTestMessage(MessageType.StoreSet, (key, value) => {
        this.set(key, value)
      })
    }
  }

  get<T extends keyof StoreData>(key: T): StoreData[T] {
    return this.data[key]
  }

  set<T extends keyof StoreData>(key: T, val: StoreData[T]): void {
    this.data[key] = val
    fs.writeFileSync(this.path, serializeStoreData(this.data))
  }
}
