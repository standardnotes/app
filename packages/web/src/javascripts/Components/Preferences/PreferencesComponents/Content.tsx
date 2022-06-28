import { FunctionComponent } from 'react'

export const Title: FunctionComponent = ({ children }) => (
  <>
    <h2 className="text-base m-0 mb-1 text-info font-bold">{children}</h2>
    <div className="min-h-2" />
  </>
)

export const Subtitle: FunctionComponent<{ className?: string }> = ({ children, className = '' }) => (
  <h4 className={`font-medium text-sm m-0 mb-1 ${className}`}>{children}</h4>
)

export const SubtitleLight: FunctionComponent<{ className?: string }> = ({ children, className = '' }) => (
  <h4 className={`font-normal text-sm m-0 mb-1 ${className}`}>{children}</h4>
)

export const Text: FunctionComponent<{ className?: string }> = ({ children, className = '' }) => (
  <p className={`${className} text-xs`}>{children}</p>
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
