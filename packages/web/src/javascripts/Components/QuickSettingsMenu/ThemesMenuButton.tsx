import { WebApplication } from '@/Application/Application'
import { FeatureIdentifier, FeatureStatus } from '@standardnotes/snjs'
import { FunctionComponent, MouseEventHandler, useCallback, useMemo } from 'react'
import Icon from '@/Components/Icon/Icon'
import { usePremiumModal } from '@/Hooks/usePremiumModal'
import Switch from '@/Components/Switch/Switch'
import { ThemeItem } from './ThemeItem'
import RadioIndicator from '../RadioIndicator/RadioIndicator'
import { PremiumFeatureIconClass, PremiumFeatureIconName } from '../Icon/PremiumFeatureIcon'
import { isMobileScreen } from '@/Utils'

type Props = {
  item: ThemeItem
  application: WebApplication
}

const ThemesMenuButton: FunctionComponent<Props> = ({ application, item }) => {
  const premiumModal = usePremiumModal()

  const isThirdPartyTheme = useMemo(
    () => application.features.isThirdPartyFeature(item.identifier),
    [application, item.identifier],
  )
  const isEntitledToTheme = useMemo(
    () => application.features.getFeatureStatus(item.identifier) === FeatureStatus.Entitled,
    [application, item.identifier],
  )
  const canActivateTheme = useMemo(() => isEntitledToTheme || isThirdPartyTheme, [isEntitledToTheme, isThirdPartyTheme])

  const toggleTheme: MouseEventHandler<HTMLButtonElement> = useCallback(
    (e) => {
      e.preventDefault()

      if (item.component && canActivateTheme) {
        const themeIsLayerableOrNotActive = item.component.isLayerable() || !item.component.active

        if (themeIsLayerableOrNotActive) {
          application.mutator.toggleTheme(item.component).catch(console.error)
        }
      } else {
        premiumModal.activate(`${item.name} theme`)
      }
    },
    [application, canActivateTheme, item, premiumModal],
  )

  const isMobile = application.isNativeMobileWeb() || isMobileScreen()

  return (
    <button
      className={
        'group flex w-full cursor-pointer items-center justify-between border-0 bg-transparent px-3 py-1.5 text-left text-sm text-text hover:bg-contrast hover:text-foreground focus:bg-info-backdrop focus:shadow-none disabled:bg-default disabled:text-passive-2'
      }
      disabled={item.identifier === FeatureIdentifier.DynamicTheme && isMobile}
      onClick={toggleTheme}
    >
      {item.component?.isLayerable() ? (
        <>
          <div className="flex items-center">
            <Switch className="mr-2 px-0" checked={item.component?.active} />
            {item.name}
          </div>
          {!canActivateTheme && <Icon type={PremiumFeatureIconName} className={PremiumFeatureIconClass} />}
        </>
      ) : (
        <>
          <div className="flex items-center">
            <RadioIndicator checked={Boolean(item.component?.active)} className="mr-2" />
            <span className={item.component?.active ? 'font-semibold' : undefined}>{item.name}</span>
          </div>
          {item.component && canActivateTheme ? (
            <div
              className="h-5 w-5 rounded-full"
              style={{
                backgroundColor: item.component.package_info?.dock_icon?.background_color,
              }}
            ></div>
          ) : (
            <Icon type={PremiumFeatureIconName} className={PremiumFeatureIconClass} />
          )}
        </>
      )}
    </button>
  )
}

export default ThemesMenuButton
