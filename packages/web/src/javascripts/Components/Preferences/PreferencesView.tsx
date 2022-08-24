import RoundIconButton from '@/Components/Button/RoundIconButton'
import { FunctionComponent, useEffect, useMemo } from 'react'
import { observer } from 'mobx-react-lite'
import { PreferencesMenu } from './PreferencesMenu'
import PreferencesCanvas from './PreferencesCanvas'
import { PreferencesProps } from './PreferencesProps'
import { RemoveScroll } from 'react-remove-scroll'
import { fitNodeToMobileScreen, isMobileScreen } from '@/Utils'

const PreferencesView: FunctionComponent<PreferencesProps> = (props) => {
  const menu = useMemo(
    () => new PreferencesMenu(props.application, props.viewControllerManager.enableUnfinishedFeatures),
    [props.viewControllerManager.enableUnfinishedFeatures, props.application],
  )

  useEffect(() => {
    menu.selectPane(props.viewControllerManager.preferencesController.currentPane)
    const removeEscKeyObserver = props.application.io.addKeyObserver({
      key: 'Escape',
      onKeyDown: (event) => {
        event.preventDefault()
        props.closePreferences()
      },
    })
    return () => {
      removeEscKeyObserver()
    }
  }, [props, menu])

  return (
    <RemoveScroll enabled={isMobileScreen()}>
      <div
        className="absolute top-0 left-0 z-preferences flex h-full max-h-screen w-full flex-col bg-contrast"
        ref={fitNodeToMobileScreen}
      >
        <div className="flex w-full flex-row items-center justify-between border-b border-solid border-border bg-default px-3 py-2 md:p-3">
          <div className="hidden h-8 w-8 md:block" />
          <h1 className="text-base font-bold md:text-lg">Your preferences for Standard Notes</h1>
          <RoundIconButton
            onClick={() => {
              props.closePreferences()
            }}
            type="normal"
            icon="close"
          />
        </div>
        <PreferencesCanvas {...props} menu={menu} />
      </div>
    </RemoveScroll>
  )
}

export default observer(PreferencesView)
