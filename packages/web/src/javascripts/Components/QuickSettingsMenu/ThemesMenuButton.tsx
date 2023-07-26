import { UIFeature, NativeFeatureIdentifier, FeatureStatus, ThemeFeatureDescription } from '@standardnotes/snjs'
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
  uiFeature: UIFeature<ThemeFeatureDescription>
}

const ThemesMenuButton: FunctionComponent<Props> = ({ uiFeature }) => {
  const application = useApplication()
  const commandService = useCommandService()
  const premiumModal = usePremiumModal()

  const isThirdPartyTheme = useMemo(
    () => application.features.isThirdPartyFeature(uiFeature.featureIdentifier),
    [application, uiFeature.featureIdentifier],
  )
  const isEntitledToTheme = useMemo(
    () => application.features.getFeatureStatus(uiFeature.uniqueIdentifier) === FeatureStatus.Entitled,
    [application, uiFeature.uniqueIdentifier],
  )
  const canActivateTheme = useMemo(() => isEntitledToTheme || isThirdPartyTheme, [isEntitledToTheme, isThirdPartyTheme])

  const toggleTheme = useCallback(() => {
    if (!canActivateTheme) {
      premiumModal.activate(`${uiFeature.displayName} theme`)
      return
    }

    const isThemeLayerable = uiFeature.layerable

    const themeIsLayerableOrNotActive = isThemeLayerable || !application.componentManager.isThemeActive(uiFeature)

    if (themeIsLayerableOrNotActive) {
      void application.componentManager.toggleTheme(uiFeature)
    }
  }, [application, canActivateTheme, uiFeature, premiumModal])

  const onClick: MouseEventHandler<HTMLButtonElement> = useCallback(
    (event) => {
      event.preventDefault()
      toggleTheme()
    },
    [toggleTheme],
  )

  const isMobile = application.isNativeMobileWeb() || isMobileScreen()
  const shouldHideButton = uiFeature.featureIdentifier === NativeFeatureIdentifier.TYPES.DynamicTheme && isMobile

  const darkThemeShortcut = useMemo(() => {
    if (uiFeature.featureIdentifier === NativeFeatureIdentifier.TYPES.DarkTheme) {
      return commandService.keyboardShortcutForCommand(TOGGLE_DARK_MODE_COMMAND)
    }
  }, [commandService, uiFeature.featureIdentifier])

  if (shouldHideButton) {
    return null
  }

  const themeActive = uiFeature ? application.componentManager.isThemeActive(uiFeature) : false

  const dockIcon = uiFeature.dockIcon

  return uiFeature.layerable ? (
    <MenuSwitchButtonItem checked={themeActive} onChange={() => toggleTheme()}>
      {!canActivateTheme && (
        <Icon type={PremiumFeatureIconName} className={classNames(PremiumFeatureIconClass, 'mr-2')} />
      )}
      {uiFeature.displayName}
    </MenuSwitchButtonItem>
  ) : (
    <MenuRadioButtonItem checked={themeActive} onClick={onClick}>
      <span className={classNames('mr-auto', themeActive ? 'font-semibold' : undefined)}>{uiFeature.displayName}</span>
      {darkThemeShortcut && <KeyboardShortcutIndicator className="mr-2" shortcut={darkThemeShortcut} />}
      {uiFeature && canActivateTheme ? (
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
