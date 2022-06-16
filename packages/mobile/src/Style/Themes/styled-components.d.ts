import theme from './blue.json'

export type MobileThemeVariables = typeof theme & {
  paddingLeft: number
  mainTextFontSize: number
}

declare module 'styled-components' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface DefaultTheme extends MobileThemeVariables {}
}
