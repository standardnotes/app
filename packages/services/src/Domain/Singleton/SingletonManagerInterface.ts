import { DecryptedItemInterface, ItemContent, Predicate, PredicateInterface } from '@standardnotes/models'

export interface SingletonManagerInterface {
  findSingleton<T extends DecryptedItemInterface>(contentType: string, predicate: PredicateInterface<T>): T | undefined

  findOrCreateContentTypeSingleton<
    C extends ItemContent = ItemContent,
    T extends DecryptedItemInterface<C> = DecryptedItemInterface<C>,
  >(
    contentType: string,
    createContent: ItemContent,
  ): Promise<T>

  findOrCreateSingleton<
    C extends ItemContent = ItemContent,
    T extends DecryptedItemInterface<C> = DecryptedItemInterface<C>,
  >(
    predicate: Predicate<T>,
    contentType: string,
    createContent: ItemContent,
  ): Promise<T>
}
