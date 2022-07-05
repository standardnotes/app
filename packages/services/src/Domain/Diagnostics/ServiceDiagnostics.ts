type DiagnosticValue =
  | string
  | number
  | Date
  | boolean
  | null
  | undefined
  | DiagnosticValue[]
  | { [key: string]: DiagnosticValue }

export type DiagnosticInfo = {
  [key: string]: Record<string, DiagnosticValue>
}

export interface ServiceDiagnostics {
  getDiagnostics(): Promise<DiagnosticInfo | undefined>
}
