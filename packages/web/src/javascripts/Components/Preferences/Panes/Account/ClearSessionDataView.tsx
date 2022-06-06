import Button from '@/Components/Button/Button'
import { ViewControllerManager } from '@/Services/ViewControllerManager'
import { observer } from 'mobx-react-lite'
import { FunctionComponent } from 'react'
import { Title, Text } from '../../PreferencesComponents/Content'
import PreferencesGroup from '../../PreferencesComponents/PreferencesGroup'
import PreferencesSegment from '../../PreferencesComponents/PreferencesSegment'

const ClearSessionDataView: FunctionComponent<{
  viewControllerManager: ViewControllerManager
}> = ({ viewControllerManager }) => {
  return (
    <PreferencesGroup>
      <PreferencesSegment>
        <Title>Clear workspace</Title>
        <Text>Remove all data related to the current workspace from the application.</Text>
        <div className="min-h-3" />
        <Button
          dangerStyle={true}
          label="Clear workspace"
          onClick={() => {
            viewControllerManager.accountMenuController.setSigningOut(true)
          }}
        />
      </PreferencesSegment>
    </PreferencesGroup>
  )
}

export default observer(ClearSessionDataView)
