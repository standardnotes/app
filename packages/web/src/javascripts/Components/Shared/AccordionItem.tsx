import { FunctionComponent, ReactNode, useRef, useState } from 'react'
import { ArrowDownCheckmarkIcon } from '@standardnotes/icons'
import { Title } from '@/Components/Preferences/PreferencesComponents/Content'
import { classNames } from '@standardnotes/snjs'

type Props = {
  title: string | JSX.Element
  className?: string
  children?: ReactNode
  onClick?: (expanded: boolean) => void
}

const AccordionItem: FunctionComponent<Props> = ({ title, className = '', children, onClick }) => {
  const elementRef = useRef<HTMLDivElement>(null)
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className={className}>
      <div
        className="relative flex cursor-pointer items-center justify-between hover:underline"
        onClick={() => {
          setIsExpanded(!isExpanded)
          if (onClick) {
            onClick(!isExpanded)
          }
        }}
      >
        <Title>{title}</Title>
        <ArrowDownCheckmarkIcon className={classNames('h-5 w-5 text-info', isExpanded && 'rotate-180')} />
      </div>
      <div className={'accordion-contents-container cursor-auto'} data-is-expanded={isExpanded} ref={elementRef}>
        {children}
      </div>
    </div>
  )
}

export default AccordionItem
