import { Dispatch, FunctionComponent, SetStateAction } from 'react'

import DecoratedInput from '@/Components/Input/DecoratedInput'

type Props = {
  setInviteeEmail: Dispatch<SetStateAction<string>>
}

const InviteForm: FunctionComponent<Props> = ({ setInviteeEmail }) => {
  return (
    <div className="flex w-full flex-col">
      <div className="mb-3">
        <label className="mb-1 block" htmlFor="invite-email-input">
          Invitee Email:
        </label>
        <DecoratedInput
          type="email"
          id="invite-email-input"
          onChange={(email) => {
            setInviteeEmail(email)
          }}
        />
      </div>
    </div>
  )
}

export default InviteForm
