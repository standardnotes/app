import { Icon } from '@/Components/Icon/Icon'
import { AppState } from '@/UIModels/AppState'
import { observer } from 'mobx-react-lite'
import { useCallback } from 'preact/hooks'

type Props = { appState: AppState }

export const NoAccountWarning = observer(({ appState }: Props) => {
  const canShow = appState.noAccountWarning.show
  if (!canShow) {
    return null
  }

  const showAccountMenu = useCallback(
    (event: Event) => {
      event.stopPropagation()
      appState.accountMenu.setShow(true)
    },
    [appState],
  )

  const hideWarning = useCallback(() => {
    appState.noAccountWarning.hide()
  }, [appState])

  return (
    <div className="mt-4 p-4 rounded-md shadow-sm grid grid-template-cols-1fr">
      <h1 className="sk-h3 m-0 font-semibold">Data not backed up</h1>
      <p className="m-0 mt-1 col-start-1 col-end-3">Sign in or register to back up your notes.</p>
      <button className="sn-button small info mt-3 col-start-1 col-end-3 justify-self-start" onClick={showAccountMenu}>
        Open Account menu
      </button>
      <button
        onClick={hideWarning}
        title="Ignore"
        label="Ignore"
        style="height: 20px"
        className="border-0 m-0 p-0 bg-transparent cursor-pointer rounded-md col-start-2 row-start-1 color-neutral hover:color-info"
      >
        <Icon type="close" className="block" />
      </button>
    </div>
  )
})
