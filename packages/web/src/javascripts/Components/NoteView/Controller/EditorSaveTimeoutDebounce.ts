import { MILLISECONDS_IN_A_SECOND } from '@/Constants/Constants'

export const EditorSaveTimeoutDebounce = {
  Desktop: 350,
  ImmediateChange: 100,
  NativeMobileWeb: 700,
  LargeNote: 60 * MILLISECONDS_IN_A_SECOND,
}
