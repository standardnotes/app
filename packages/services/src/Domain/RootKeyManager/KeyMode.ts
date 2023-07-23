export enum KeyMode {
  /** i.e No account and no passcode */
  RootKeyNone = 0,
  /** i.e Account but no passcode */
  RootKeyOnly = 1,
  /** i.e Account plus passcode */
  RootKeyPlusWrapper = 2,
  /** i.e No account, but passcode */
  WrapperOnly = 3,
}
