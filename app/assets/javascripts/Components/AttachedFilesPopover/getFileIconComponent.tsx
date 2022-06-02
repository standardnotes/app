import { ICONS } from '@/Components/Icon/Icon'

export const getFileIconComponent = (iconType: string, className: string) => {
  const IconComponent = ICONS[iconType as keyof typeof ICONS]

  return <IconComponent className={className} />
}
