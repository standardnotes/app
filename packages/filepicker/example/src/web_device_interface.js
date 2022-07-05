/* eslint-disable no-undef */
const KEYCHAIN_STORAGE_KEY = 'keychain'

export default class WebDeviceInterface {
  async getRawStorageValue(key) {
    return localStorage.getItem(key)
  }

  async getJsonParsedRawStorageValue(key) {
    const value = await this.getRawStorageValue(key)
    if (isNullOrUndefined(value)) {
      return undefined
    }
    try {
      return JSON.parse(value)
    } catch (e) {
      return value
    }
  }

  async getAllRawStorageKeyValues() {
    const results = []
    for (const key of Object.keys(localStorage)) {
      results.push({
        key: key,
        value: localStorage[key],
      })
    }
    return results
  }

  async setRawStorageValue(key, value) {
    localStorage.setItem(key, value)
  }

  async removeRawStorageValue(key) {
    localStorage.removeItem(key)
  }

  async removeAllRawStorageValues() {
    localStorage.clear()
  }

  async openDatabase(_identifier) {
    return {}
  }

  _getDatabaseKeyPrefix(identifier) {
    if (identifier) {
      return `${identifier}-item-`
    } else {
      return 'item-'
    }
  }

  _keyForPayloadId(id, identifier) {
    return `${this._getDatabaseKeyPrefix(identifier)}${id}`
  }

  async getAllRawDatabasePayloads(identifier) {
    const models = []
    for (const key in localStorage) {
      if (key.startsWith(this._getDatabaseKeyPrefix(identifier))) {
        models.push(JSON.parse(localStorage[key]))
      }
    }
    return models
  }

  async saveRawDatabasePayload(payload, identifier) {
    localStorage.setItem(this._keyForPayloadId(payload.uuid, identifier), JSON.stringify(payload))
  }

  async saveRawDatabasePayloads(payloads, identifier) {
    for (const payload of payloads) {
      await this.saveRawDatabasePayload(payload, identifier)
    }
  }

  async removeRawDatabasePayloadWithId(id, identifier) {
    localStorage.removeItem(this._keyForPayloadId(id, identifier))
  }

  async removeAllRawDatabasePayloads(identifier) {
    for (const key in localStorage) {
      if (key.startsWith(this._getDatabaseKeyPrefix(identifier))) {
        delete localStorage[key]
      }
    }
  }

  /** @keychain */
  async getNamespacedKeychainValue(identifier) {
    const keychain = await this.getRawKeychainValue(identifier)
    if (!keychain) {
      return
    }
    return keychain[identifier]
  }

  async setNamespacedKeychainValue(value, identifier) {
    let keychain = await this.getRawKeychainValue()
    if (!keychain) {
      keychain = {}
    }
    localStorage.setItem(
      KEYCHAIN_STORAGE_KEY,
      JSON.stringify({
        ...keychain,
        [identifier]: value,
      }),
    )
  }

  async clearNamespacedKeychainValue(identifier) {
    const keychain = await this.getRawKeychainValue()
    if (!keychain) {
      return
    }
    delete keychain[identifier]
    localStorage.setItem(KEYCHAIN_STORAGE_KEY, JSON.stringify(keychain))
  }

  /** Allows unit tests to set legacy keychain structure as it was <= 003 */
  // eslint-disable-next-line camelcase
  async setLegacyRawKeychainValue(value) {
    localStorage.setItem(KEYCHAIN_STORAGE_KEY, JSON.stringify(value))
  }

  async getRawKeychainValue() {
    const keychain = localStorage.getItem(KEYCHAIN_STORAGE_KEY)
    return JSON.parse(keychain)
  }

  async clearRawKeychainValue() {
    localStorage.removeItem(KEYCHAIN_STORAGE_KEY)
  }
}
