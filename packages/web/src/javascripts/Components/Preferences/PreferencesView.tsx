import RoundIconButton from '@/Components/Button/RoundIconButton'
import TitleBar from '@/Components/TitleBar/TitleBar'
import Title from '@/Components/TitleBar/Title'
import { FunctionComponent, useEffect, useMemo } from 'react'
import { observer } from 'mobx-react-lite'
import { PreferencesMenu } from './PreferencesMenu'
import PreferencesCanvas from './PreferencesCanvas'
import { PreferencesProps } from './PreferencesProps'

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
    <div className="h-full w-full absolute top-0 left-0 flex flex-col bg-contrast z-preferences">
      <TitleBar className="items-center justify-between">
        <div className="h-8 w-8" />
        <Title className="text-lg">Your preferences for Standard Notes</Title>
        <RoundIconButton
          onClick={() => {
            props.closePreferences()
          }}
          type="normal"
          icon="close"
        />
      </TitleBar>
      <PreferencesCanvas {...props} menu={menu} />
    </div>
  )
}

export default observer(PreferencesView)
