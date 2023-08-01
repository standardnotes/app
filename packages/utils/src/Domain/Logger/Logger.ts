/* eslint-disable @typescript-eslint/no-explicit-any */

import { LogLevel } from './LogLevel'

export class Logger {
  private level: LogLevel = 'none'

  constructor(private appIdentifier: string) {}

  private canLog(level: LogLevel): boolean {
    if (this.level === 'none') {
      return false
    }

    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error']
    return levels.indexOf(level) >= levels.indexOf(this.level)
  }

  public setLevel(level: LogLevel): void {
    this.level = level
  }

  public debug(message: string, ...optionalParams: any[]): void {
    if (this.canLog('debug')) {
      this.logWithColor(message, ...optionalParams)
    }
  }

  public info(message: string, ...optionalParams: any[]): void {
    if (this.canLog('info')) {
      this.logWithColor(message, ...optionalParams)
    }
  }

  public warn(message: string, ...optionalParams: any[]): void {
    if (this.canLog('warn')) {
      console.warn(message, ...optionalParams)
    }
  }

  public error(message: string, ...optionalParams: any[]): void {
    if (this.canLog('error')) {
      console.error(message, ...optionalParams)
    }
  }

  private logWithColor(...args: any[]): void {
    const date = new Date()
    const timeString = `${date.toLocaleTimeString().replace(' PM', '').replace(' AM', '')}.${date.getMilliseconds()}`
    this.customLog(
      `%c${this.appIdentifier}%c${timeString}`,
      'color: font-weight: bold; margin-right: 4px',
      'color: gray',
      ...args,
    )
  }

  private customLog(..._args: any[]) {
    // eslint-disable-next-line no-console, prefer-rest-params
    Function.prototype.apply.call(console.log, console, arguments)
  }
}

export default Logger
