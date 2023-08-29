import { BlockWithAlignableContents } from '@lexical/react/LexicalBlockWithAlignableContents'
import { classNames } from '@standardnotes/snjs'
import { ElementFormatType, NodeKey } from 'lexical'

type Props = {
  fileName: string | undefined
  mimeType: string
  src: string
  className: Readonly<{
    base: string
    focus: string
  }>
  format: ElementFormatType | null
  nodeKey: NodeKey
}

const InlineFileComponent = ({ className, src, mimeType, fileName, format, nodeKey }: Props) => {
  const isPDF = mimeType === 'application/pdf'
  return (
    <BlockWithAlignableContents className={className} format={format} nodeKey={nodeKey}>
      {mimeType.startsWith('image') ? (
        <div className="relative flex min-h-[2rem] flex-col items-center gap-2.5">
          <img alt={fileName} src={src} />
        </div>
      ) : mimeType.startsWith('video') ? (
        <video className="h-full w-full" controls autoPlay>
          <source src={src} type={mimeType} />
        </video>
      ) : mimeType.startsWith('audio') ? (
        <div className="flex h-full w-full items-center justify-center">
          <audio controls>
            <source src={src} type={mimeType} />
          </audio>
        </div>
      ) : (
        <object
          className={classNames('h-full w-full', isPDF && 'min-h-[65vh]')}
          data={isPDF ? src + '#view=FitV' : src}
        />
      )}
    </BlockWithAlignableContents>
  )
}

export default InlineFileComponent
