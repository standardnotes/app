import { Dispatch, FunctionComponent, SetStateAction } from 'react'

import DecoratedInput from '@/Components/Input/DecoratedInput'

type Props = {
  setInviteeEmail: Dispatch<SetStateAction<string>>
}

const InviteForm: FunctionComponent<Props> = ({ setInviteeEmail }) => {
  return (
    <div className="flex w-full flex-col">
      <div className="mb-3">
        <label className="mb-1 block font-bold" htmlFor="invite-email-input">
          Invitee Email
        </label>

        <DecoratedInput
          type="email"
          className={{ container: 'mt-4' }}
          id="invite-email-input"
          onChange={(email) => {
            setInviteeEmail(email)
          }}
        />

        <p className="mt-4">
          <span className="font-bold">Note: </span>
          The invitee must have an existing account with Standard Notes. If they do not have an account yet, instruct
          them to make an account first.
        </p>
      </div>
    </div>
  )
}

export default InviteForm
