import { IconNameToSvgMapping } from '@/Components/Icon/IconNameToSvgMapping'

export const getFileIconComponent = (iconType: string, className: string) => {
  const IconComponent = IconNameToSvgMapping[iconType as keyof typeof IconNameToSvgMapping]

  return <IconComponent className={className} />
}
