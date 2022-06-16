import { SNApplication, SNTag } from '@standardnotes/snjs'

export const rootTags = (application: SNApplication): SNTag[] => {
  const hasNoParent = (tag: SNTag) => !application.items.getTagParent(tag)

  const allTags = application.items.getDisplayableTags()
  const rootTags = allTags.filter(hasNoParent)

  return rootTags
}

export const tagSiblings = (application: SNApplication, tag: SNTag): SNTag[] => {
  const withoutCurrentTag = (tags: SNTag[]) => tags.filter((other) => other.uuid !== tag.uuid)

  const isTemplateTag = application.items.isTemplateItem(tag)
  const parentTag = !isTemplateTag && application.items.getTagParent(tag)

  if (parentTag) {
    const siblingsAndTag = application.items.getTagChildren(parentTag)
    return withoutCurrentTag(siblingsAndTag)
  }

  return withoutCurrentTag(rootTags(application))
}

export const isValidFutureSiblings = (application: SNApplication, futureSiblings: SNTag[], tag: SNTag): boolean => {
  const siblingWithSameName = futureSiblings.find((otherTag) => otherTag.title === tag.title)

  if (siblingWithSameName) {
    application.alertService
      ?.alert(
        `A tag with the name ${tag.title} already exists at this destination. Please rename this tag before moving and try again.`,
      )
      .catch(console.error)
    return false
  }
  return true
}
