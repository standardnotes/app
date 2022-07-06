/**
 * An abstract class with no instance methods. Used globally to generate uuids by any
 * consumer. Application must call SetGenerator before use.
 */
export class UuidGenerator {
  private static syncUuidFunc: () => string

  /**
   * @param {function} syncImpl - A syncronous function that returns a UUID.
   */
  static SetGenerator(syncImpl: () => string): void {
    this.syncUuidFunc = syncImpl
  }

  /**
   * Generates a UUID string asyncronously.
   */
  public static GenerateUuid(): string {
    return this.syncUuidFunc()
  }
}
