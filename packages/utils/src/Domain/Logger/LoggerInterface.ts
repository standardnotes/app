/* eslint-disable @typescript-eslint/no-explicit-any */
import { LogLevel } from './LogLevel'

export interface LoggerInterface {
  setLevel(level: LogLevel): void
  debug(message: string, ...optionalParams: any[]): void
  info(message: string, ...optionalParams: any[]): void
  warn(message: string, ...optionalParams: any[]): void
  error(message: string, ...optionalParams: any[]): void
}
