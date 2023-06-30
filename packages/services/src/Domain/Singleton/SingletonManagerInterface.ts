import { DecryptedItemInterface, ItemContent, Predicate, PredicateInterface } from '@standardnotes/models'
import { ContentType } from '@standardnotes/common'

export interface SingletonManagerInterface {
  findSingleton<T extends DecryptedItemInterface>(
    contentType: ContentType,
    predicate: PredicateInterface<T>,
  ): T | undefined

  findOrCreateContentTypeSingleton<
    C extends ItemContent = ItemContent,
    T extends DecryptedItemInterface<C> = DecryptedItemInterface<C>,
  >(
    contentType: ContentType,
    createContent: ItemContent,
  ): Promise<T>

  findOrCreateSingleton<
    C extends ItemContent = ItemContent,
    T extends DecryptedItemInterface<C> = DecryptedItemInterface<C>,
  >(
    predicate: Predicate<T>,
    contentType: ContentType,
    createContent: ItemContent,
  ): Promise<T>
}
