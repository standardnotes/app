/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
export class SNLog {
  static log(...message: any): void {
    this.onLog(...message)
  }
  static error<T extends Error>(error: T): T {
    this.onError(error)
    return error
  }
  static onLog: (...message: any) => void
  static onError: (error: Error) => void
}
