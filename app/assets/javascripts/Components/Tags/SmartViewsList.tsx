import { AppState } from '@/UIModels/AppState'
import { observer } from 'mobx-react-lite'
import { FunctionComponent } from 'react'
import SmartViewsListItem from './SmartViewsListItem'

type Props = {
  appState: AppState
}

const SmartViewsList: FunctionComponent<Props> = ({ appState }: Props) => {
  const allViews = appState.tags.smartViews

  return (
    <>
      {allViews.map((view) => {
        return <SmartViewsListItem key={view.uuid} view={view} tagsState={appState.tags} features={appState.features} />
      })}
    </>
  )
}

export default observer(SmartViewsList)
