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

const buttonClasses =
  'block bg-default text-text rounded border-solid \
border px-4 py-1.5 font-bold text-base lg:text-sm w-fit \
focus:bg-contrast hover:bg-contrast border-border'

export const LinkButton: FunctionComponent<{
  label: string
  link: string
  className?: string
  onClick?: MouseEventHandler<HTMLAnchorElement>
}> = ({ label, link, className, onClick }) => (
  <a target="_blank" className={`${className} ${buttonClasses}`} href={link} onClick={onClick}>
    {label}
  </a>
)
