import { ButtonStyle, getColorsForPrimaryVariant } from '@/Components/Button/Button'
import { classNames } from '@standardnotes/utils'
import { FunctionComponent, MouseEventHandler, ReactNode } from 'react'

type Props = {
  className?: string
  children: ReactNode
}

export const Title: FunctionComponent<Props> = ({ children, className }) => (
  <h2 className={classNames('m-0 mb-1 text-lg font-bold text-info md:text-base', className)}>{children}</h2>
)

export const Subtitle: FunctionComponent<Props> = ({ children, className }) => (
  <h4 className={classNames('m-0 mb-1 text-base font-medium lg:text-sm', className)}>{children}</h4>
)

export const SubtitleLight: FunctionComponent<Props> = ({ children, className }) => (
  <h4 className={classNames('m-0 mb-1 text-base font-normal lg:text-sm', className)}>{children}</h4>
)

export const Text: FunctionComponent<Props> = ({ children, className }) => (
  <p className={classNames('text-base lg:text-xs', className)}>{children}</p>
)

export const SmallText: FunctionComponent<Props> = ({ children, className }) => (
  <p className={classNames('text-sm lg:text-xs', className)}>{children}</p>
)

export const LinkButton: FunctionComponent<{
  label: string
  link: string
  className?: string
  onClick?: MouseEventHandler<HTMLAnchorElement>
}> = ({ label, link, className, onClick }) => (
  <a
    target="_blank"
    className={classNames(
      'block w-fit rounded border border-solid border-border bg-normal-button px-4 py-1.5 text-base font-bold text-text hover:bg-contrast focus:bg-contrast lg:text-sm',
      className,
    )}
    href={link}
    onClick={onClick}
  >
    {label}
  </a>
)

type PillProps = Props & {
  style: ButtonStyle
}

export const Pill: FunctionComponent<PillProps> = ({ children, className, style }) => {
  const colorClass = getColorsForPrimaryVariant(style)
  return (
    <div className={classNames('ml-2 rounded px-2 py-1 text-[10px] font-bold', className, colorClass)}>{children}</div>
  )
}
