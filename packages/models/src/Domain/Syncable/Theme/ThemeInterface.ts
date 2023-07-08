import { ComponentInterface } from '../Component'

export interface ThemeInterface extends ComponentInterface {
  get layerable(): boolean
}
