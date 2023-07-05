import Icon from '@/Components/Icon/Icon'

export const GreenCheckmarkCircle = () => {
  return (
    <button
      className={
        'peer flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-success text-success-contrast'
      }
    >
      <Icon type={'check'} size="small" />
    </button>
  )
}
