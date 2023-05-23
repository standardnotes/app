import { observer } from 'mobx-react-lite'
import { Title } from '@/Components/Preferences/PreferencesComponents/Content'
import PreferencesGroup from '@/Components/Preferences/PreferencesComponents/PreferencesGroup'
import PreferencesSegment from '@/Components/Preferences/PreferencesComponents/PreferencesSegment'
import { useApplication } from '@/Components/ApplicationProvider'
import ContactItem from './Contacts/ContactItem'
import ModalOverlay from '@/Components/Modal/ModalOverlay'
import AddContact from './Contacts/AddContactModal'
import { useCallback, useEffect, useState } from 'react'
import { GroupServerHash } from '@standardnotes/snjs'
import GroupItem from './Groups/GroupItem'
import Button from '@/Components/Button/Button'

const Collaboration = () => {
  const [isAddContactModalOpen, setIsAddContactModalOpen] = useState(false)
  const application = useApplication()

  const [groups, setGroups] = useState<GroupServerHash[]>([])
  const closeAddContactModal = () => setIsAddContactModalOpen(false)

  const groupService = application.groups
  const contactService = application.contacts
  const contacts = contactService.getAllContacts()

  useEffect(() => {
    const fetchGroups = async () => {
      const groups = groupService.getGroups()
      setGroups(groups)
    }

    void fetchGroups()
  }, [groupService])

  const createNewGroup = useCallback(() => {
    void groupService.createGroup()
  }, [groupService])

  return (
    <>
      <ModalOverlay isOpen={isAddContactModalOpen} close={closeAddContactModal}>
        <AddContact onCloseDialog={closeAddContactModal} />
      </ModalOverlay>

      <PreferencesGroup>
        <PreferencesSegment>
          <Title>Contacts</Title>
          <div className="my-2 flex flex-col">
            {contacts.map((contact) => {
              return <ContactItem contact={contact} key={contact.uuid} />
            })}
          </div>
        </PreferencesSegment>
      </PreferencesGroup>

      <PreferencesGroup>
        <PreferencesSegment>
          <Title>Groups</Title>
          <div className="my-2 flex flex-col">
            {groups.map((group) => {
              return <GroupItem group={group} key={group.uuid} />
            })}
          </div>
          <div className="mt-2.5 flex flex-row">
            <Button label="Create New Group" className={'mr-3 text-xs'} onClick={createNewGroup} />
          </div>
        </PreferencesSegment>
      </PreferencesGroup>
    </>
  )
}

export default observer(Collaboration)
