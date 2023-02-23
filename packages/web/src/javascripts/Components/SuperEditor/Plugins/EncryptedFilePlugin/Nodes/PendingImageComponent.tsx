import { useApplication } from '@/Components/ApplicationProvider'
import Spinner from '@/Components/Spinner/Spinner'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { useEffect } from 'react'
import { $createFileNode } from './FileUtils'
import { PendingImageNode } from './PendingImageNode'

const PendingImageComponent = ({ src, node }: { src: string; node: PendingImageNode }) => {
  const application = useApplication()
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    const abortController = new AbortController()

    const fetchImage = async () => {
      try {
        const response = await fetch(src, { signal: abortController.signal })

        if (!response.ok) {
          return
        }

        const blob = await response.blob()
        const file = new File([blob], src, { type: blob.type })

        const filesController = application.getViewControllerManager().filesController

        const uploadedFile = await filesController.uploadNewFile(file, false)

        if (!uploadedFile) {
          return
        }

        editor.update(() => {
          const fileNode = $createFileNode(uploadedFile.uuid)
          node.replace(fileNode)
        })
      } catch (error) {
        if (abortController.signal.aborted) {
          return
        }
        console.error(error)
      }
    }

    void fetchImage()

    return () => {
      abortController.abort()
    }
  }, [application, editor, node, src])

  return (
    <div className="flex select-none items-center justify-center gap-2 p-2">
      <Spinner className="h-5 w-5 flex-shrink-0" />
      <div className="overflow-hidden whitespace-nowrap">
        Downloading image "
        <span
          title={src}
          className="inline-block max-w-[20ch] overflow-hidden text-ellipsis whitespace-nowrap align-bottom"
        >
          {src}
        </span>
        " to Files...
      </div>
    </div>
  )
}

export default PendingImageComponent
