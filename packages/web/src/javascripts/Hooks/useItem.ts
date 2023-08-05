import { useApplication } from '@/Components/ApplicationProvider'
import { DecryptedItemInterface, LiveItem } from '@standardnotes/snjs'
import { useEffect, useState } from 'react'

const useItem = <T extends DecryptedItemInterface>(uuid: string | undefined) => {
  const application = useApplication()

  const [item, setItem] = useState<T>()

  useEffect(() => {
    if (!uuid) {
      return
    }

    const live = new LiveItem<T>(uuid, application.items, (item) => {
      setItem(item)
    })

    return () => live.deinit()
  }, [uuid, application])

  if (!uuid) {
    return undefined
  }

  return item
}

export default useItem
