import { AnyKeyParamsContent, ProtocolVersion } from '@standardnotes/common'
import { KeyParamsData } from '@standardnotes/responses'
import { V001Algorithm, V002Algorithm } from '../../Algorithm'

export function ProtocolVersionForKeyParams(response: KeyParamsData | AnyKeyParamsContent): ProtocolVersion {
  if (response.version) {
    return response.version
  }
  /**
   * 001 and 002 key params (as stored locally) may not report a version number.
   * In some cases it may be impossible to differentiate between 001 and 002 params,
   * but there are a few rules we can use to find a best fit.
   */
  /**
   * First try to determine by cost. If the cost appears in V002 costs but not V001 costs,
   * we know it's 002.
   */
  const cost = response.pw_cost!
  const appearsInV001 = V001Algorithm.PbkdfCostsUsed.includes(cost)
  const appearsInV002 = V002Algorithm.PbkdfCostsUsed.includes(cost)

  if (appearsInV001 && !appearsInV002) {
    return ProtocolVersion.V001
  } else if (appearsInV002 && !appearsInV001) {
    return ProtocolVersion.V002
  } else if (appearsInV002 && appearsInV001) {
    /**
     * If the cost appears in both versions, we can be certain it's 002 if it's missing
     * the pw_nonce property. (However late versions of 002 also used a pw_nonce, so its
     * presence doesn't automatically indicate 001.)
     */
    if (!response.pw_nonce) {
      return ProtocolVersion.V002
    } else {
      /**
       * We're now at the point that the cost has appeared in both versions, and a pw_nonce
       * is present. We'll have to go with what is more statistically likely.
       */
      if (V002Algorithm.ImprobablePbkdfCostsUsed.includes(cost)) {
        return ProtocolVersion.V001
      } else {
        return ProtocolVersion.V002
      }
    }
  } else {
    /** Doesn't appear in either V001 or V002; unlikely possibility. */
    return ProtocolVersion.V002
  }
}
