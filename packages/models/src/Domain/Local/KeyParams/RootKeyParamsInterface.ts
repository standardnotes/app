import {
  KeyParamsContent001,
  KeyParamsContent002,
  KeyParamsContent003,
  KeyParamsContent004,
  AnyKeyParamsContent,
  ProtocolVersion,
  KeyParamsOrigination,
} from '@standardnotes/common'

/**
 * Key params are public data that contain information about how a root key was created.
 * Given a keyParams object and a password, clients can compute a root key that was created
 * previously.
 */
export interface RootKeyParamsInterface {
  readonly content: AnyKeyParamsContent

  /**
   * For consumers to determine whether the object they are
   * working with is a proper RootKeyParams object.
   */
  get isKeyParamsObject(): boolean

  get identifier(): string

  get version(): ProtocolVersion
  get origination(): KeyParamsOrigination | undefined

  get content001(): KeyParamsContent001

  get content002(): KeyParamsContent002

  get content003(): KeyParamsContent003

  get content004(): KeyParamsContent004

  get createdDate(): Date | undefined

  compare(other: RootKeyParamsInterface): boolean

  /**
   * When saving in a file or communicating with server,
   * use the original values.
   */
  getPortableValue(): AnyKeyParamsContent
}
