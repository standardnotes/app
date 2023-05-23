import Icon from '@/Components/Icon/Icon'
import { TrustedContactInterface } from '@standardnotes/snjs'

type Props = {
  contact: TrustedContactInterface
}

const ContactItem = ({ contact }: Props) => {
  return (
    <div className="flex items-center gap-2 py-1.5">
      <Icon type={'share'} size="custom" className="h-5.5 w-5.5 flex-shrink-0" />
      <span className="mr-auto overflow-hidden text-ellipsis text-sm">{contact.name}</span>
      <span className="mr-auto overflow-hidden text-ellipsis text-sm">{contact.publicKey}</span>
      <span className="mr-auto overflow-hidden text-ellipsis text-sm">{contact.contactUuid}</span>
    </div>
  )
}

export default ContactItem
