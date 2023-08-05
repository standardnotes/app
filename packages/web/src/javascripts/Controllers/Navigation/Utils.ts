import { AlertService, ItemManagerInterface, SNTag } from '@standardnotes/snjs'

export const rootTags = (items: ItemManagerInterface): SNTag[] => {
  const hasNoParent = (tag: SNTag) => !items.getTagParent(tag)

  const allTags = items.getDisplayableTags()
  const rootTags = allTags.filter(hasNoParent)

  return rootTags
}

export const tagSiblings = (items: ItemManagerInterface, tag: SNTag): SNTag[] => {
  const withoutCurrentTag = (tags: SNTag[]) => tags.filter((other) => other.uuid !== tag.uuid)

  const isTemplateTag = items.isTemplateItem(tag)
  const parentTag = !isTemplateTag && items.getTagParent(tag)

  if (parentTag) {
    const siblingsAndTag = items.getTagChildren(parentTag)
    return withoutCurrentTag(siblingsAndTag)
  }

  return withoutCurrentTag(rootTags(items))
}

export const isValidFutureSiblings = (alerts: AlertService, futureSiblings: SNTag[], tag: SNTag): boolean => {
  const siblingWithSameName = futureSiblings.find((otherTag) => otherTag.title === tag.title)

  if (siblingWithSameName) {
    alerts
      ?.alert(
        `A tag with the name ${tag.title} already exists at this destination. Please rename this tag before moving and try again.`,
      )
      .catch(console.error)
    return false
  }
  return true
}
