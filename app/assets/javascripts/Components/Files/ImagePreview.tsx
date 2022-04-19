import { IconType } from '@standardnotes/snjs'
import { FunctionComponent } from 'preact'
import { useEffect, useRef, useState } from 'preact/hooks'
import { IconButton } from '../Button/IconButton'

type Props = {
  objectUrl: string
}

export const ImagePreview: FunctionComponent<Props> = ({ objectUrl }) => {
  const initialImgHeightRef = useRef<number>()

  const [imageZoomPercent, setImageZoomPercent] = useState(100)
  const [imageHeight, setImageHeight] = useState(initialImgHeightRef.current)

  useEffect(() => {
    if (initialImgHeightRef.current) {
      setImageHeight(imageZoomPercent * (initialImgHeightRef.current / 100))
    }
  }, [imageZoomPercent])

  return (
    <div className="flex items-center justify-center w-full h-full overflow-auto">
      <img
        src={objectUrl}
        height={imageHeight}
        ref={(imgElement) => {
          if (!initialImgHeightRef.current) {
            initialImgHeightRef.current = imgElement?.height
          }
        }}
      />
      <div className="flex items-center absolute bottom-6 py-1 px-3 bg-default border-1 border-solid border-main rounded">
        <span className="mr-1.5">Zoom:</span>
        <IconButton
          className="hover:bg-contrast p-1 rounded"
          icon="add"
          title="Zoom In"
          focusable={true}
          onClick={() => {
            setImageZoomPercent((percent) => percent + 10)
          }}
        />
        <span className="mx-2">{imageZoomPercent}%</span>
        <IconButton
          className="hover:bg-contrast p-1 rounded"
          icon={'subtract' as IconType}
          title="Zoom Out"
          focusable={true}
          onClick={() => {
            setImageZoomPercent((percent) => {
              const newPercent = percent - 10
              if (newPercent >= 10) {
                return newPercent
              } else {
                return percent
              }
            })
          }}
        />
      </div>
    </div>
  )
}
