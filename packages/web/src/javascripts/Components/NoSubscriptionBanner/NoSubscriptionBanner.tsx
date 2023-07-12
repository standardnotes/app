import { WebApplication } from '@/Application/WebApplication'
import { classNames } from '@standardnotes/utils'
import Button from '../Button/Button'
import Icon from '../Icon/Icon'
import { PremiumFeatureIconClass, PremiumFeatureIconName } from '../Icon/PremiumFeatureIcon'

const NoSubscriptionBanner = ({
  application,
  title,
  message,
  className,
}: {
  application: WebApplication
  title: string
  message: string
  className?: string
}) => {
  const onClick = () => {
    if (application.isNativeIOS()) {
      application.showPremiumModal()
    } else {
      void application.openPurchaseFlow()
    }
  }

  return (
    <div className={classNames('grid grid-cols-1 rounded-md border border-border p-4', className)}>
      <div className="flex items-center">
        <Icon className={classNames('-ml-1 mr-1 h-5 w-5', PremiumFeatureIconClass)} type={PremiumFeatureIconName} />
        <h1 className="sk-h3 m-0 text-sm font-semibold">{title}</h1>
      </div>
      <p className="col-start-1 col-end-3 m-0 mt-1 text-sm">{message}</p>
      <Button primary small className="col-start-1 col-end-3 mt-3 justify-self-start uppercase" onClick={onClick}>
        Upgrade Features
      </Button>
    </div>
  )
}

export default NoSubscriptionBanner
