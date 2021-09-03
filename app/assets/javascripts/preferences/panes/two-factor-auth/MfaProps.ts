export interface MfaGateway {
  getUser(): { uuid: string } | undefined;

  isMfaActivated(): Promise<boolean>;

  generateMfaSecret(): Promise<string>;

  getOtpToken(secret: string): Promise<string>;

  enableMfa(secret: string, otpToken: string): Promise<void>;

  disableMfa(): Promise<void>;
}

export interface MfaProps {
  mfaGateway: MfaGateway;
}
