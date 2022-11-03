import { ComponentRelayOptions } from './ComponentRelayOptions'

export type ComponentRelayParams = {
  /**
   * Represents the window object that the component is running in.
   */
  targetWindow: Window
  /**
   * The options to initialize
   */
  options?: ComponentRelayOptions
  /**
   * A callback that is executed after the component has been registered.
   */
  onReady?: () => void
  /**
   * A callback that is executed after themes have been changed.
   */
  onThemesChange?: () => void

  handleRequestForContentHeight: () => number | undefined
}
