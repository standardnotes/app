import { WebApplication } from '@/Application/WebApplication'
import { FeatureIdentifier, FeatureStatus } from '@standardnotes/snjs'
import { FunctionComponent, MouseEventHandler, useCallback, useMemo } from 'react'
import Icon from '@/Components/Icon/Icon'
import { usePremiumModal } from '@/Hooks/usePremiumModal'
import { ThemeItem } from './ThemeItem'
import { PremiumFeatureIconClass, PremiumFeatureIconName } from '../Icon/PremiumFeatureIcon'
import { isMobileScreen } from '@/Utils'
import { classNames } from '@standardnotes/utils'
import MenuSwitchButtonItem from '../Menu/MenuSwitchButtonItem'
import MenuRadioButtonItem from '../Menu/MenuRadioButtonItem'
import { useCommandService } from '../CommandProvider'
import { TOGGLE_DARK_MODE_COMMAND } from '@standardnotes/ui-services'
import { KeyboardShortcutIndicator } from '../KeyboardShortcutIndicator/KeyboardShortcutIndicator'

type Props = {
  item: ThemeItem
  application: WebApplication
}

const ThemesMenuButton: FunctionComponent<Props> = ({ application, item }) => {
  const commandService = useCommandService()
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

  const toggleTheme = useCallback(() => {
    if (item.component && canActivateTheme) {
      const isThemeLayerable = item.component.isLayerable()
      const themeIsLayerableOrNotActive = isThemeLayerable || !item.component.active

      if (themeIsLayerableOrNotActive) {
        application.mutator.toggleTheme(item.component).catch(console.error)
      }
    } else {
      premiumModal.activate(`${item.name} theme`)
    }
  }, [application, canActivateTheme, item, premiumModal])

  const onClick: MouseEventHandler<HTMLButtonElement> = useCallback(
    (event) => {
      event.preventDefault()
      toggleTheme()
    },
    [toggleTheme],
  )

  const isMobile = application.isNativeMobileWeb() || isMobileScreen()
  const shouldHideButton = item.identifier === FeatureIdentifier.DynamicTheme && isMobile

  const darkThemeShortcut = useMemo(() => {
    if (item.identifier === FeatureIdentifier.DarkTheme) {
      return commandService.keyboardShortcutForCommand(TOGGLE_DARK_MODE_COMMAND)
    }
  }, [commandService, item.identifier])

  if (shouldHideButton) {
    return null
  }

  return item.component?.isLayerable() ? (
    <MenuSwitchButtonItem checked={item.component.active} onChange={() => toggleTheme()}>
      {!canActivateTheme && (
        <Icon type={PremiumFeatureIconName} className={classNames(PremiumFeatureIconClass, 'mr-2')} />
      )}
      {item.name}
    </MenuSwitchButtonItem>
  ) : (
    <MenuRadioButtonItem checked={Boolean(item.component?.active)} onClick={onClick}>
      <span className={classNames('mr-auto', item.component?.active ? 'font-semibold' : undefined)}>{item.name}</span>
      {darkThemeShortcut && <KeyboardShortcutIndicator className="mr-2" shortcut={darkThemeShortcut} />}
      {item.component && canActivateTheme ? (
        <div
          className="h-5 w-5 rounded-full"
          style={{
            backgroundColor: item.component.package_info?.dock_icon?.background_color,
          }}
        ></div>
      ) : (
        <Icon type={PremiumFeatureIconName} className={classNames(PremiumFeatureIconClass, 'ml-auto')} />
      )}
    </MenuRadioButtonItem>
  )
}

export default ThemesMenuButton
