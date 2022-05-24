import { AppState } from '@/UIModels/AppState'
import { isStateDealloced } from '@/UIModels/AppState/AbstractState'
import { observer } from 'mobx-react-lite'
import { FunctionComponent } from 'react'
import { SmartViewsListItem } from './SmartViewsListItem'

type Props = {
  appState: AppState
}

export const SmartViewsList: FunctionComponent<Props> = observer(({ appState }: Props) => {
  if (isStateDealloced(appState)) {
    return null
  }

  const allViews = appState.tags.smartViews

  return (
    <>
      {allViews.map((view) => {
        return <SmartViewsListItem key={view.uuid} view={view} tagsState={appState.tags} features={appState.features} />
      })}
    </>
  )
})
