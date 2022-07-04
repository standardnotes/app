import { AnyKeyParamsContent } from '@standardnotes/common'

/**
 * <= V003 optionally included key params content as last component in encrypted string
 * as a json stringified base64 representation. This data is attached but not included
 * in authentication hash.
 */
export type LegacyAttachedData = AnyKeyParamsContent & Record<string, unknown>
