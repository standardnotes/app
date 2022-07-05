import {
  AnyKeyParamsContent,
  KeyParamsContent001,
  KeyParamsContent002,
  KeyParamsContent003,
  KeyParamsContent004,
  KeyParamsOrigination,
  ProtocolVersion,
} from '@standardnotes/common'
import { RootKeyParamsInterface } from '@standardnotes/models'
import { pickByCopy } from '@standardnotes/utils'
import { ProtocolVersionForKeyParams } from './ProtocolVersionForKeyParams'
import { ValidKeyParamsKeys } from './ValidKeyParamsKeys'

export class SNRootKeyParams implements RootKeyParamsInterface {
  public readonly content: AnyKeyParamsContent

  constructor(content: AnyKeyParamsContent) {
    this.content = {
      ...content,
      origination: content.origination || KeyParamsOrigination.Registration,
      version: content.version || ProtocolVersionForKeyParams(content),
    }
  }

  get isKeyParamsObject(): boolean {
    return true
  }

  get identifier(): string {
    return this.content004.identifier || this.content002.email
  }

  get version(): ProtocolVersion {
    return this.content.version
  }

  get origination(): KeyParamsOrigination | undefined {
    return this.content.origination
  }

  get content001(): KeyParamsContent001 {
    return this.content as KeyParamsContent001
  }

  get content002(): KeyParamsContent002 {
    return this.content as KeyParamsContent002
  }

  get content003(): KeyParamsContent003 {
    return this.content as KeyParamsContent003
  }

  get content004(): KeyParamsContent004 {
    return this.content as KeyParamsContent004
  }

  get createdDate(): Date | undefined {
    if (!this.content004.created) {
      return undefined
    }
    return new Date(Number(this.content004.created))
  }

  compare(other: SNRootKeyParams): boolean {
    if (this.version !== other.version) {
      return false
    }

    if ([ProtocolVersion.V004, ProtocolVersion.V003].includes(this.version)) {
      return this.identifier === other.identifier && this.content004.pw_nonce === other.content003.pw_nonce
    } else if ([ProtocolVersion.V002, ProtocolVersion.V001].includes(this.version)) {
      return this.identifier === other.identifier && this.content002.pw_salt === other.content001.pw_salt
    } else {
      throw Error('Unhandled version in KeyParams.compare')
    }
  }

  getPortableValue(): AnyKeyParamsContent {
    return pickByCopy(this.content, ValidKeyParamsKeys as (keyof AnyKeyParamsContent)[])
  }
}
