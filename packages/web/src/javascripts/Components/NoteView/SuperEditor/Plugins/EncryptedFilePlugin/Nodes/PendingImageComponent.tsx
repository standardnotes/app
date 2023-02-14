import Spinner from '@/Components/Spinner/Spinner'
import { useEffect } from 'react'

const PendingImageComponent = ({ src }: { src: string }) => {
  useEffect(() => {
    const abortController = new AbortController()

    const fetchImage = async () => {
      try {
        const response = await fetch(src, { signal: abortController.signal })

        if (!response.ok) {
          return
        }
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
  }, [src])

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
