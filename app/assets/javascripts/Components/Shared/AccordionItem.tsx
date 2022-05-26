import { FunctionComponent, useRef, useState } from 'react'
import { ArrowDownCheckmarkIcon } from '@standardnotes/icons'
import { Title } from '@/Components/Preferences/PreferencesComponents/Content'

type Props = {
  title: string | JSX.Element
  className?: string
}

const AccordionItem: FunctionComponent<Props> = ({ title, className = '', children }) => {
  const elementRef = useRef<HTMLDivElement>(null)
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className={className}>
      <div
        className={'relative flex cursor-pointer hover:underline'}
        onClick={() => {
          setIsExpanded(!isExpanded)
        }}
      >
        <Title>{title}</Title>
        <ArrowDownCheckmarkIcon
          className={'sn-accordion-arrow-icon absolute right-0'}
          width={20}
          height={20}
          data-is-expanded={isExpanded}
        />
      </div>
      <div className={'accordion-contents-container cursor-auto'} data-is-expanded={isExpanded} ref={elementRef}>
        {children}
      </div>
    </div>
  )
}

export default AccordionItem
