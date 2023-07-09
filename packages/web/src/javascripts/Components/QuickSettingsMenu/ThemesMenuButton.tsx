import { ComponentOrNativeTheme, FeatureIdentifier, FeatureStatus, isNativeTheme } from '@standardnotes/snjs'
import { FunctionComponent, MouseEventHandler, useCallback, useMemo } from 'react'
import Icon from '@/Components/Icon/Icon'
import { usePremiumModal } from '@/Hooks/usePremiumModal'
import { PremiumFeatureIconClass, PremiumFeatureIconName } from '../Icon/PremiumFeatureIcon'
import { isMobileScreen } from '@/Utils'
import { classNames } from '@standardnotes/utils'
import MenuSwitchButtonItem from '../Menu/MenuSwitchButtonItem'
import MenuRadioButtonItem from '../Menu/MenuRadioButtonItem'
import { useCommandService } from '../CommandProvider'
import { TOGGLE_DARK_MODE_COMMAND } from '@standardnotes/ui-services'
import { KeyboardShortcutIndicator } from '../KeyboardShortcutIndicator/KeyboardShortcutIndicator'
import { useApplication } from '../ApplicationProvider'

type Props = {
  item: ComponentOrNativeTheme
}

const ThemesMenuButton: FunctionComponent<Props> = ({ item }) => {
  const application = useApplication()
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
    if (!canActivateTheme) {
      premiumModal.activate(`${item.name} theme`)
      return
    }

    const isThemeLayerable = isNativeTheme(item) ? item.layerable : item.layerable

    const themeIsLayerableOrNotActive = isThemeLayerable || !application.componentManager.isThemeActive(item)

    if (themeIsLayerableOrNotActive) {
      void application.componentManager.toggleTheme(item)
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

  const themeActive = item ? application.componentManager.isThemeActive(item) : false

  const dockIcon = isNativeTheme(item) ? item.dock_icon : item.package_info?.dock_icon

  return item?.layerable ? (
    <MenuSwitchButtonItem checked={themeActive} onChange={() => toggleTheme()}>
      {!canActivateTheme && (
        <Icon type={PremiumFeatureIconName} className={classNames(PremiumFeatureIconClass, 'mr-2')} />
      )}
      {item.name}
    </MenuSwitchButtonItem>
  ) : (
    <MenuRadioButtonItem checked={themeActive} onClick={onClick}>
      <span className={classNames('mr-auto', themeActive ? 'font-semibold' : undefined)}>{item.name}</span>
      {darkThemeShortcut && <KeyboardShortcutIndicator className="mr-2" shortcut={darkThemeShortcut} />}
      {item && canActivateTheme ? (
        <div
          className="h-5 w-5 rounded-full"
          style={{
            backgroundColor: dockIcon?.background_color,
          }}
        ></div>
      ) : (
        <Icon type={PremiumFeatureIconName} className={classNames(PremiumFeatureIconClass, 'ml-auto')} />
      )}
    </MenuRadioButtonItem>
  )
}

export default ThemesMenuButton
