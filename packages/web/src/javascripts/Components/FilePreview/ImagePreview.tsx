import { IconType } from '@standardnotes/snjs'
import { FunctionComponent, useRef, useState } from 'react'
import IconButton from '../Button/IconButton'

type Props = {
  objectUrl: string
}

const ImagePreview: FunctionComponent<Props> = ({ objectUrl }) => {
  const initialImgHeightRef = useRef<number>()

  const [imageZoomPercent, setImageZoomPercent] = useState(100)

  return (
    <div className="flex h-full min-h-0 w-full items-center justify-center">
      <div className="relative flex h-full w-full items-center justify-center overflow-auto">
        <img
          src={objectUrl}
          style={{
            height: `${imageZoomPercent}%`,
            ...(imageZoomPercent <= 100
              ? {
                  minWidth: '100%',
                  objectFit: 'contain',
                }
              : {
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  margin: 'auto',
                }),
          }}
          ref={(imgElement) => {
            if (!initialImgHeightRef.current) {
              initialImgHeightRef.current = imgElement?.height
            }
          }}
        />
      </div>
      <div className="absolute left-1/2 bottom-6 flex -translate-x-1/2 items-center rounded border border-solid border-border bg-default py-1 px-3">
        <span className="mr-1.5">Zoom:</span>
        <IconButton
          className="rounded p-1 hover:bg-contrast"
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
        <span className="mx-2">{imageZoomPercent}%</span>
        <IconButton
          className="rounded p-1 hover:bg-contrast"
          icon="add"
          title="Zoom In"
          focusable={true}
          onClick={() => {
            setImageZoomPercent((percent) => percent + 10)
          }}
        />
      </div>
    </div>
  )
}

export default ImagePreview
