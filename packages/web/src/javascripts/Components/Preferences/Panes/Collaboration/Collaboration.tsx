import { observer } from 'mobx-react-lite'
import { Subtitle, Title } from '@/Components/Preferences/PreferencesComponents/Content'
import PreferencesGroup from '@/Components/Preferences/PreferencesComponents/PreferencesGroup'
import PreferencesSegment from '@/Components/Preferences/PreferencesComponents/PreferencesSegment'
import { useApplication } from '@/Components/ApplicationProvider'
import ContactItem from './Contacts/ContactItem'
import ModalOverlay from '@/Components/Modal/ModalOverlay'
import AddContact from './Contacts/AddContact'
import { useCallback, useEffect, useState } from 'react'
import { GroupInviteServerHash, GroupServerHash } from '@standardnotes/snjs'
import GroupItem from './Groups/GroupItem'
import Button from '@/Components/Button/Button'
import InviteItem from './Invites/InviteItem'

const Collaboration = () => {
  const [isAddContactModalOpen, setIsAddContactModalOpen] = useState(false)
  const application = useApplication()

  const [groups, setGroups] = useState<GroupServerHash[]>([])
  const [invites, setInvites] = useState<GroupInviteServerHash[]>([])

  const closeAddContactModal = () => setIsAddContactModalOpen(false)

  const groupService = application.groups
  const contactService = application.contacts
  const contacts = contactService.getAllContacts()

  useEffect(() => {
    const fetchGroups = async () => {
      await application.sync.sync()
      const groups = groupService.getGroups()
      setGroups(groups)
    }

    void fetchGroups()
  }, [application.sync, groupService])

  useEffect(() => {
    const fetchInvites = async () => {
      await application.sync.sync()
      const invites = groupService.getPendingInvites()
      setInvites(invites)
    }
    void fetchInvites()
  }, [application.sync, groupService])

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
          <Title>Invites</Title>
          <div className="my-2 flex flex-col">
            {invites.map((invite) => {
              return <InviteItem invite={invite} key={invite.uuid} />
            })}
          </div>
        </PreferencesSegment>
      </PreferencesGroup>

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

      <PreferencesGroup>
        <PreferencesSegment>
          <Title>CollaborationID</Title>
          <Subtitle>Share your CollaborationID with collaborators to join their groups.</Subtitle>
          <div className="my-2 flex flex-col"></div>
          <div className="mt-2.5 flex flex-row">
            <code>
              <pre>{contactService.getCollaborationID()}</pre>
            </code>
          </div>
        </PreferencesSegment>
      </PreferencesGroup>
    </>
  )
}

export default observer(Collaboration)
