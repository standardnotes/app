import { WebApplication } from '@/Application/Application'
import { FeatureStatus } from '@standardnotes/snjs'
import { FunctionComponent, MouseEventHandler, useCallback, useMemo } from 'react'
import Icon from '@/Components/Icon/Icon'
import { usePremiumModal } from '@/Hooks/usePremiumModal'
import Switch from '@/Components/Switch/Switch'
import { ThemeItem } from './ThemeItem'
import RadioIndicator from '../RadioIndicator/RadioIndicator'

type Props = {
  item: ThemeItem
  application: WebApplication
  onBlur: (event: { relatedTarget: EventTarget | null }) => void
}

const ThemesMenuButton: FunctionComponent<Props> = ({ application, item, onBlur }) => {
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

  return (
    <button
      className={
        'flex items-center border-0 cursor-pointer hover:bg-contrast hover:text-foreground text-text bg-transparent px-3 py-1.5 text-left w-full focus:bg-info-backdrop focus:shadow-none text-sm focus:bg-info-backdrop focus:shadow-none justify-between'
      }
      onClick={toggleTheme}
      onBlur={onBlur}
    >
      {item.component?.isLayerable() ? (
        <>
          <div className="flex items-center">
            <Switch className="px-0 mr-2" checked={item.component?.active} />
            {item.name}
          </div>
          {!canActivateTheme && <Icon type="premium-feature" />}
        </>
      ) : (
        <>
          <div className="flex items-center">
            <RadioIndicator checked={Boolean(item.component?.active)} className="mr-2" />
            <span className={item.component?.active ? 'font-semibold' : undefined}>{item.name}</span>
          </div>
          {item.component && canActivateTheme ? (
            <div
              className="w-5 h-5 rounded-full"
              style={{
                backgroundColor: item.component.package_info?.dock_icon?.background_color,
              }}
            ></div>
          ) : (
            <Icon type="premium-feature" />
          )}
        </>
      )}
    </button>
  )
}

export default ThemesMenuButton
