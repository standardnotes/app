import { ApplicationContext } from '@Root/ApplicationContext'
import { HistoryEntry, NoteHistoryEntry, SNNote } from '@standardnotes/snjs'
import React, { useCallback, useContext, useEffect, useState } from 'react'
import { FlatList, ListRenderItem } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { NoteHistoryCell } from './NoteHistoryCell'

type Props = {
  note: SNNote
  onPress: (uuid: string, revision: NoteHistoryEntry, title: string) => void
}
export const SessionHistory: React.FC<Props> = ({ note, onPress }) => {
  // Context
  const application = useContext(ApplicationContext)
  const insets = useSafeAreaInsets()

  // State
  const [sessionHistory, setSessionHistory] = useState<HistoryEntry[]>()

  useEffect(() => {
    if (note) {
      setSessionHistory(application?.historyManager?.sessionHistoryForItem(note))
    }
  }, [application?.historyManager, note])

  const onItemPress = useCallback(
    (item: NoteHistoryEntry) => {
      onPress(item.payload.uuid, item, item.previewTitle())
    },
    [onPress],
  )

  const RenderItem: ListRenderItem<NoteHistoryEntry> | null | undefined = ({ item }) => {
    return (
      <NoteHistoryCell
        onPress={() => onItemPress(item)}
        title={item.previewTitle()}
        subTitle={item.previewSubTitle()}
      />
    )
  }

  return (
    <FlatList<NoteHistoryEntry>
      keyExtractor={item => item.previewTitle()}
      contentContainerStyle={{ paddingBottom: insets.bottom }}
      initialNumToRender={10}
      windowSize={10}
      keyboardShouldPersistTaps={'never'}
      data={sessionHistory as NoteHistoryEntry[]}
      renderItem={RenderItem}
    />
  )
}
