import Button from '@/Components/Button/Button'
import { observer } from 'mobx-react-lite'
import { FunctionComponent } from 'react'
import { Title, Text } from '../../PreferencesComponents/Content'
import PreferencesGroup from '../../PreferencesComponents/PreferencesGroup'
import PreferencesSegment from '../../PreferencesComponents/PreferencesSegment'
import { useApplication } from '@/Components/ApplicationProvider'
import { c } from 'ttag'

const ClearSessionDataView: FunctionComponent = () => {
  const application = useApplication()

  return (
    <PreferencesGroup>
      <PreferencesSegment>
        <Title>{c('Title').t`Clear workspace`}</Title>
        <Text className="mb-3">{c('Info')
          .t`Remove all data related to the current workspace from the application.`}</Text>
        <Button
          colorStyle="danger"
          label={c('Action').t`Clear workspace`}
          onClick={() => {
            application.accountMenuController.setSigningOut(true)
          }}
        />
      </PreferencesSegment>
    </PreferencesGroup>
  )
}

export default observer(ClearSessionDataView)
