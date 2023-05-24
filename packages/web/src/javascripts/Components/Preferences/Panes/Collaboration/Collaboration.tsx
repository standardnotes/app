import { observer } from 'mobx-react-lite'
import { Subtitle, Title } from '@/Components/Preferences/PreferencesComponents/Content'
import PreferencesGroup from '@/Components/Preferences/PreferencesComponents/PreferencesGroup'
import PreferencesSegment from '@/Components/Preferences/PreferencesComponents/PreferencesSegment'
import { useApplication } from '@/Components/ApplicationProvider'
import ContactItem from './Contacts/ContactItem'
import ModalOverlay from '@/Components/Modal/ModalOverlay'
import AddContact from './Contacts/AddContact'
import { useCallback, useEffect, useState } from 'react'
import { GroupInviteServerHash, GroupServerHash, isClientDisplayableError } from '@standardnotes/snjs'
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

  const fetchGroups = useCallback(async () => {
    const groups = await application.groups.reloadGroups()
    if (!isClientDisplayableError(groups)) {
      setGroups(groups)
    }
  }, [application.groups])

  useEffect(() => {
    void fetchGroups()
  }, [fetchGroups])

  const fetchInvites = useCallback(async () => {
    await groupService.downloadInboundInvites()
    const invites = groupService.getPendingInvites()
    setInvites(invites)
  }, [groupService])

  useEffect(() => {
    void fetchInvites()
  }, [application.sync, fetchInvites, groupService])

  const createNewGroup = useCallback(async () => {
    await groupService.createGroup()
    await fetchGroups()
  }, [fetchGroups, groupService])

  const createNewContact = useCallback(() => {
    setIsAddContactModalOpen(true)
  }, [])

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
          <div className="mt-2.5 flex flex-row">
            <Button label="Add New Contact" className={'mr-3 text-xs'} onClick={createNewContact} />
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
          {contactService.isCollaborationEnabled() ? (
            <div className="mt-2.5 flex flex-row">
              <code>
                <pre>{contactService.getCollaborationID()}</pre>
              </code>
            </div>
          ) : (
            <div className="mt-2.5 flex flex-row">
              <Button
                label="Enable Collaboration"
                className={'mr-3 text-xs'}
                onClick={() => contactService.enableCollaboration()}
              />
            </div>
          )}
        </PreferencesSegment>
      </PreferencesGroup>
    </>
  )
}

export default observer(Collaboration)
