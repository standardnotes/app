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
    <div className="flex items-center justify-center w-full h-full min-h-0">
      <div className="flex items-center justify-center w-full h-full relative overflow-auto">
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
      <div className="flex items-center absolute left-1/2 -translate-x-1/2 bottom-6 py-1 px-3 bg-default border border-solid border-border rounded">
        <span className="mr-1.5">Zoom:</span>
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
        <span className="mx-2">{imageZoomPercent}%</span>
        <IconButton
          className="hover:bg-contrast p-1 rounded"
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
