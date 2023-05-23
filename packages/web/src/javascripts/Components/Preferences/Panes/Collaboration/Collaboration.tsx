import { observer } from 'mobx-react-lite'
import { Title, Subtitle } from '@/Components/Preferences/PreferencesComponents/Content'
import PreferencesGroup from '@/Components/Preferences/PreferencesComponents/PreferencesGroup'
import PreferencesSegment from '@/Components/Preferences/PreferencesComponents/PreferencesSegment'

const Collaboration = () => {
  return (
    <>
      <PreferencesGroup>
        <PreferencesSegment>
          <Title>Collaboration</Title>
          <div className="flex items-center justify-between">
            <div className="mr-10 flex flex-col">
              <Subtitle>WIP</Subtitle>
            </div>
          </div>
        </PreferencesSegment>
      </PreferencesGroup>
    </>
  )
}

export default observer(Collaboration)
