import { observer } from 'mobx-react-lite'
import { Subtitle, Title } from '@/Components/Preferences/PreferencesComponents/Content'
import PreferencesGroup from '@/Components/Preferences/PreferencesComponents/PreferencesGroup'
import PreferencesSegment from '@/Components/Preferences/PreferencesComponents/PreferencesSegment'
import { useApplication } from '@/Components/ApplicationProvider'
import ContactItem from './Contacts/ContactItem'
import ModalOverlay from '@/Components/Modal/ModalOverlay'
import EditContactModal from './Contacts/EditContactModal'
import { useCallback, useEffect, useState } from 'react'
import {
  ContactServiceEvent,
  GroupInviteServerHash,
  GroupServerHash,
  TrustedContactInterface,
  isClientDisplayableError,
} from '@standardnotes/snjs'
import GroupItem from './Groups/GroupItem'
import Button from '@/Components/Button/Button'
import InviteItem from './Invites/InviteItem'
import EditGroupModal from './Groups/EditGroupModal'
import { GroupServiceEvent } from '@standardnotes/services'

const Collaboration = () => {
  const application = useApplication()

  const [groups, setGroups] = useState<GroupServerHash[]>([])
  const [invites, setInvites] = useState<GroupInviteServerHash[]>([])
  const [contacts, setContacts] = useState<TrustedContactInterface[]>([])

  const [isAddContactModalOpen, setIsAddContactModalOpen] = useState(false)
  const closeAddContactModal = () => setIsAddContactModalOpen(false)

  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false)
  const closeGroupModal = () => setIsGroupModalOpen(false)

  const groupService = application.groups
  const contactService = application.contacts

  const fetchGroups = useCallback(async () => {
    const groups = await application.groups.reloadGroups()
    if (!isClientDisplayableError(groups)) {
      setGroups(groups)
    }
  }, [application.groups])

  const fetchInvites = useCallback(async () => {
    await groupService.downloadInboundInvites()
    const invites = groupService.getCachedInboundInvites()
    setInvites(invites)
  }, [groupService])

  const fetchContacts = useCallback(async () => {
    const contacts = contactService.getAllContacts()
    setContacts(contacts)
  }, [contactService])

  const createNewGroup = useCallback(async () => {
    setIsGroupModalOpen(true)
  }, [])

  const createNewContact = useCallback(() => {
    setIsAddContactModalOpen(true)
  }, [])

  useEffect(() => {
    return contactService.addEventObserver((event) => {
      if (event === ContactServiceEvent.ContactsChanged) {
        void fetchContacts()
      }
    })
  }, [contactService, fetchContacts])

  useEffect(() => {
    return groupService.addEventObserver((event) => {
      if (event === GroupServiceEvent.GroupsChanged) {
        void fetchGroups()
        void fetchInvites()
      }
    })
  }, [fetchGroups, fetchInvites, groupService])

  useEffect(() => {
    void fetchGroups()
    void fetchInvites()
    void fetchContacts()
  }, [fetchContacts, fetchGroups, fetchInvites])

  return (
    <>
      <ModalOverlay isOpen={isAddContactModalOpen} close={closeAddContactModal}>
        <EditContactModal onCloseDialog={closeAddContactModal} />
      </ModalOverlay>

      <ModalOverlay isOpen={isGroupModalOpen} close={closeGroupModal}>
        <EditGroupModal onCloseDialog={closeGroupModal} />
      </ModalOverlay>

      <PreferencesGroup>
        <PreferencesSegment>
          <Title>Incoming Invites</Title>
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
