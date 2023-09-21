import { compareValues } from '@standardnotes/utils'
import { isDeletedItem, isEncryptedItem } from '../../Abstract/Item'
import { ItemDelta } from '../Index/ItemDelta'
import { AnyDisplayOptions, DisplayControllerDisplayOptions, GenericDisplayOptions } from './DisplayOptions'
import { sortTwoItems } from './SortTwoItems'
import { UuidToSortedPositionMap, DisplayItem, ReadonlyItemCollection } from './Types'
import { CriteriaValidatorInterface } from './Validator/CriteriaValidatorInterface'
import { CollectionCriteriaValidator } from './Validator/CollectionCriteriaValidator'
import { CustomFilterCriteriaValidator } from './Validator/CustomFilterCriteriaValidator'
import { ExcludeVaultsCriteriaValidator } from './Validator/ExcludeVaultsCriteriaValidator'
import { ExclusiveVaultCriteriaValidator } from './Validator/ExclusiveVaultCriteriaValidator'
import { HiddenContentCriteriaValidator } from './Validator/HiddenContentCriteriaValidator'
import { VaultDisplayOptions } from './VaultDisplayOptions'
import { isExclusionaryOptionsValue } from './VaultDisplayOptionsTypes'

export class ItemDisplayController<I extends DisplayItem, O extends AnyDisplayOptions = GenericDisplayOptions> {
  private sortMap: UuidToSortedPositionMap = {}
  private sortedItems: I[] = []
  private needsSort = true

  constructor(
    private readonly collection: ReadonlyItemCollection,
    public readonly contentTypes: string[],
    private options: DisplayControllerDisplayOptions & O,
    private vaultOptions?: VaultDisplayOptions,
  ) {
    this.filterThenSortElements(this.collection.all(this.contentTypes) as I[])
  }

  public items(): I[] {
    return this.sortedItems
  }

  public hasExclusiveVaultOptions(): boolean {
    return this.vaultOptions ? !isExclusionaryOptionsValue(this.vaultOptions.getOptions()) : false
  }

  public getDisplayOptions(): DisplayControllerDisplayOptions & O {
    return this.options
  }

  setVaultDisplayOptions(vaultOptions?: VaultDisplayOptions): void {
    this.vaultOptions = vaultOptions
    this.needsSort = true

    this.filterThenSortElements(this.collection.all(this.contentTypes) as I[])
  }

  setDisplayOptions(displayOptions: Partial<DisplayControllerDisplayOptions & O>): void {
    this.options = { ...this.options, ...displayOptions }
    this.needsSort = true

    this.filterThenSortElements(this.collection.all(this.contentTypes) as I[])
  }

  onCollectionChange(delta: ItemDelta): void {
    const items = [...delta.changed, ...delta.inserted, ...delta.discarded].filter((i) =>
      this.contentTypes.includes(i.content_type),
    )
    this.filterThenSortElements(items as I[])
  }

  private passesAllFilters(element: I): boolean {
    const filters: CriteriaValidatorInterface[] = [new CollectionCriteriaValidator(this.collection, element)]

    if (this.vaultOptions) {
      const options = this.vaultOptions.getOptions()
      if (isExclusionaryOptionsValue(options)) {
        filters.push(new ExcludeVaultsCriteriaValidator([...options.exclude, ...options.locked], element))
      } else {
        filters.push(new ExclusiveVaultCriteriaValidator(options.exclusive, element))
      }
    }

    if ('hiddenContentTypes' in this.options && this.options.hiddenContentTypes) {
      filters.push(new HiddenContentCriteriaValidator(this.options.hiddenContentTypes, element))
    }

    if ('customFilter' in this.options && this.options.customFilter) {
      filters.push(new CustomFilterCriteriaValidator(this.options.customFilter, element))
    }

    return filters.every((f) => f.passes())
  }

  private filterThenSortElements(elements: I[]): void {
    for (const element of elements) {
      const previousIndex = this.sortMap[element.uuid]
      const previousElement = previousIndex != undefined ? this.sortedItems[previousIndex] : undefined

      const remove = () => {
        if (previousIndex != undefined) {
          delete this.sortMap[element.uuid]

          /** We don't yet remove the element directly from the array, since mutating
           * the array inside a loop could render all other upcoming indexes invalid */
          ;(this.sortedItems[previousIndex] as unknown) = undefined

          /** Since an element is being removed from the array, we need to recompute
           * the new positions for elements that are staying */
          this.needsSort = true
        }
      }

      if (isDeletedItem(element) || isEncryptedItem(element)) {
        remove()
        continue
      }

      const passes = this.passesAllFilters(element)

      if (passes) {
        if (previousElement != undefined) {
          /** Check to see if the element has changed its sort value. If so, we need to re-sort. */
          const previousValue = previousElement[this.options.sortBy]

          const newValue = element[this.options.sortBy]

          /** Replace the current element with the new one. */
          this.sortedItems[previousIndex] = element

          /** If the pinned status of the element has changed, it needs to be resorted */
          const pinChanged = previousElement.pinned !== element.pinned

          if (!compareValues(previousValue, newValue) || pinChanged) {
            /** Needs resort because its re-sort value has changed,
             * and thus its position might change */
            this.needsSort = true
          }
        } else {
          /** Has not yet been inserted */
          this.sortedItems.push(element)

          /** Needs re-sort because we're just pushing the element to the end here */
          this.needsSort = true
        }
      } else {
        /** Doesn't pass filter, remove from sorted and filtered */
        remove()
      }
    }

    if (this.needsSort) {
      this.needsSort = false
      this.resortItems()
    }
  }

  /** Resort the sortedItems array, and update the saved positions */
  private resortItems() {
    const resorted = this.sortedItems.sort((a, b) => {
      return sortTwoItems(a, b, this.options.sortBy, this.options.sortDirection)
    })

    /**
     * Now that resorted contains the sorted elements (but also can contain undefined element)
     * we create another array that filters out any of the undefinedes. We also keep track of the
     * current index while we loop and set that in the this.sortMap.
     * */
    const results = []
    let currentIndex = 0

    /** @O(n) */
    for (const element of resorted) {
      if (!element) {
        continue
      }

      results.push(element)

      this.sortMap[element.uuid] = currentIndex

      currentIndex++
    }

    this.sortedItems = results
  }
}
