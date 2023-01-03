import { ApplicationIdentifier } from '@standardnotes/snjs'

/**
 * This identifier was the database name used in Standard Notes web/desktop.
 */
const LEGACY_IDENTIFIER = 'standardnotes'

/**
 * We use this function to decide if we need to prefix the identifier in getDatabaseKeyPrefix or not.
 * It is also used to decide if the raw or the namespaced keychain is used.
 * @param identifier The ApplicationIdentifier
 */
export const isLegacyIdentifier = function (identifier: ApplicationIdentifier) {
  return identifier && identifier === LEGACY_IDENTIFIER
}
