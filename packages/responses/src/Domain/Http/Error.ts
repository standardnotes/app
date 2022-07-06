export type Error = {
  message: string
  status: number
  tag?: string
  /** In the case of MFA required responses,
   * the required prompt is returned as part of the error */
  payload?: {
    mfa_key?: string
  }
}
