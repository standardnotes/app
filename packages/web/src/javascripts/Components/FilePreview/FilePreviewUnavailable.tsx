import { NoPreviewIllustration } from '@standardnotes/icons'
import { ReactNode } from 'react'
import { c } from 'ttag'

type Props = {
  description?: ReactNode
  children?: ReactNode
}

const FilePreviewUnavailable = ({ description, children }: Props) => {
  return (
    <div className="flex flex-grow flex-col items-center justify-center">
      <NoPreviewIllustration className="mb-4 h-30 w-30" />
      <div className="mb-2 text-base font-bold">{c('B7.FilesSubscriptionHelp.Files.Info')
        .t`This file can't be previewed.`}</div>
      {description && <div className="mb-4 max-w-[35ch] text-center text-sm text-passive-0">{description}</div>}
      {children}
    </div>
  )
}

export default FilePreviewUnavailable
