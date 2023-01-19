import { ItemInterface } from '../../Abstract/Item/Interfaces/ItemInterface'

export function FindItem<I extends ItemInterface = ItemInterface>(items: I[], uuid: string): I | undefined {
  return items.find((item) => item.uuid === uuid)
}

export function SureFindItem<I extends ItemInterface = ItemInterface>(items: I[], uuid: string): I {
  return FindItem(items, uuid) as I
}
