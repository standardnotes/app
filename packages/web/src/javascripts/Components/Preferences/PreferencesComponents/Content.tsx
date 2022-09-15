import { classNames } from '@/Utils/ConcatenateClassNames'
import { FunctionComponent, ReactNode } from 'react'

type Props = {
  className?: string
  children: ReactNode
}

export const Title: FunctionComponent<Props> = ({ children, className }) => (
  <h2 className={classNames('m-0 mb-1 text-lg font-bold text-info md:text-base', className)}>{children}</h2>
)

export const Subtitle: FunctionComponent<Props> = ({ children, className }) => (
  <h4 className={classNames('m-0 mb-1 text-sm font-medium', className)}>{children}</h4>
)

export const SubtitleLight: FunctionComponent<Props> = ({ children, className }) => (
  <h4 className={classNames('m-0 mb-1 text-sm font-normal', className)}>{children}</h4>
)

export const Text: FunctionComponent<Props> = ({ children, className }) => (
  <p className={classNames('text-sm md:text-xs', className)}>{children}</p>
)

const buttonClasses =
  'block bg-default text-text rounded border-solid \
border px-4 py-1.5 font-bold text-sm w-fit \
focus:bg-contrast hover:bg-contrast border-border'

export const LinkButton: FunctionComponent<{
  label: string
  link: string
  className?: string
}> = ({ label, link, className }) => (
  <a target="_blank" className={`${className} ${buttonClasses}`} href={link}>
    {label}
  </a>
)
