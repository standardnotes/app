import { ItemDelta } from './ItemDelta'

export interface SNIndex {
  onChange(delta: ItemDelta): void
}
