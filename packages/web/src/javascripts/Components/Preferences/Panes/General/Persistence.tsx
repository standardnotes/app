import { WebApplication } from '@/Application/WebApplication'
import StyledRadioInput from '@/Components/Radio/StyledRadioInput'
import { useState } from 'react'
import { Title } from '../../PreferencesComponents/Content'
import PreferencesGroup from '../../PreferencesComponents/PreferencesGroup'
import PreferencesSegment from '../../PreferencesComponents/PreferencesSegment'

type Props = {
  application: WebApplication
}

export const ShouldPersistNoteStateKey = 'ShouldPersistNoteState'

const Persistence = ({ application }: Props) => {
  const [shouldPersistNoteState, setShouldPersistNoteState] = useState(
    application.getValue<boolean>(ShouldPersistNoteStateKey),
  )

  const toggleStatePersistence = (shouldPersist: boolean) => {
    application.setValue(ShouldPersistNoteStateKey, shouldPersist)
    setShouldPersistNoteState(shouldPersist)

    if (shouldPersist) {
      application.persistence.persistCurrentState()
    } else {
      application.persistence.clearPersistedValues()
    }
  }

  return (
    <PreferencesGroup>
      <PreferencesSegment>
        <Title className="mb-2">When opening the app, show...</Title>
        <label className="mb-2 flex items-center gap-2 text-base font-medium md:text-sm">
          <StyledRadioInput
            name="state-persistence"
            checked={!shouldPersistNoteState}
            onChange={(event) => {
              toggleStatePersistence(!event.target.checked)
            }}
          />
          The first note in the list
        </label>
        <label className="flex items-center gap-2 text-base font-medium md:text-sm">
          <StyledRadioInput
            name="state-persistence"
            checked={!!shouldPersistNoteState}
            onChange={(event) => {
              toggleStatePersistence(event.target.checked)
            }}
          />
          The last viewed note
        </label>
      </PreferencesSegment>
    </PreferencesGroup>
  )
}

export default Persistence
