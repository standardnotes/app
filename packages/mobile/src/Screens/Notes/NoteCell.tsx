import { useChangeNote, useDeleteNoteWithPrivileges, useProtectOrUnprotectNote } from '@Lib/SnjsHelperHooks'
import { ApplicationContext } from '@Root/ApplicationContext'
import { SnIcon } from '@Root/Components/SnIcon'
import { NoteCellIconFlags } from '@Root/Screens/Notes/NoteCellIconFlags'
import { CollectionSort, CollectionSortProperty, IconType, isNullOrUndefined, SNNote } from '@standardnotes/snjs'
import { CustomActionSheetOption, useCustomActionSheet } from '@Style/CustomActionSheet'
import { getTintColorForEditor } from '@Style/Utils'
import React, { useContext, useRef, useState } from 'react'
import { Text, View } from 'react-native'
import { ThemeContext } from 'styled-components'
import {
  Container,
  DetailsText,
  FlexContainer,
  NoteContentsContainer,
  NoteDataContainer,
  NoteText,
  styles,
  TitleText,
  TouchableContainer,
} from './NoteCell.styled'
import { NoteCellFlags } from './NoteCellFlags'

type Props = {
  note: SNNote
  highlighted?: boolean
  onPressItem: (noteUuid: SNNote['uuid']) => void
  hideDates: boolean
  hidePreviews: boolean
  hideEditorIcon: boolean
  sortType: CollectionSortProperty
}

export const NoteCell = ({
  note,
  onPressItem,
  highlighted,
  sortType,
  hideDates,
  hidePreviews,
  hideEditorIcon,
}: Props) => {
  // Context
  const application = useContext(ApplicationContext)
  const theme = useContext(ThemeContext)

  const [changeNote] = useChangeNote(note)
  const [protectOrUnprotectNote] = useProtectOrUnprotectNote(note)

  // State
  const [selected, setSelected] = useState(false)

  // Ref
  const selectionTimeout = useRef<ReturnType<typeof setTimeout>>()
  const elementRef = useRef<View>(null)

  const { showActionSheet } = useCustomActionSheet()

  const [deleteNote] = useDeleteNoteWithPrivileges(
    note,
    async () => {
      await application?.mutator.deleteItem(note)
    },
    () => {
      void changeNote(mutator => {
        mutator.trashed = true
      }, false)
    },
    undefined,
  )

  const highlight = Boolean(selected || highlighted)

  const _onPress = () => {
    setSelected(true)
    selectionTimeout.current = setTimeout(() => {
      setSelected(false)
      onPressItem(note.uuid)
    }, 25)
  }

  const _onPressIn = () => {
    setSelected(true)
  }

  const _onPressOut = () => {
    setSelected(false)
  }

  const onLongPress = () => {
    if (note.protected) {
      showActionSheet({
        title: note.title,
        options: [
          {
            text: 'Note Protected',
          },
        ],
        anchor: elementRef.current ?? undefined,
      })
    } else {
      let options: CustomActionSheetOption[] = []

      options.push({
        text: note.pinned ? 'Unpin' : 'Pin',
        key: 'pin',
        callback: () =>
          changeNote(mutator => {
            mutator.pinned = !note.pinned
          }, false),
      })

      options.push({
        text: note.archived ? 'Unarchive' : 'Archive',
        key: 'archive',
        callback: () => {
          if (note.locked) {
            void application?.alertService.alert(
              `This note has editing disabled. If you'd like to ${
                note.archived ? 'unarchive' : 'archive'
              } it, enable editing on it, and try again.`,
            )
            return
          }

          void changeNote(mutator => {
            mutator.archived = !note.archived
          }, false)
        },
      })

      options.push({
        text: note.locked ? 'Enable editing' : 'Prevent editing',
        key: 'lock',
        callback: () =>
          changeNote(mutator => {
            mutator.locked = !note.locked
          }, false),
      })

      options.push({
        text: note.protected ? 'Unprotect' : 'Protect',
        key: 'protect',
        callback: async () => await protectOrUnprotectNote(),
      })

      if (!note.trashed) {
        options.push({
          text: 'Move to Trash',
          key: 'trash',
          destructive: true,
          callback: async () => deleteNote(false),
        })
      } else {
        options = options.concat([
          {
            text: 'Restore',
            key: 'restore-note',
            callback: () => {
              void changeNote(mutator => {
                mutator.trashed = false
              }, false)
            },
          },
          {
            text: 'Delete permanently',
            key: 'delete-forever',
            destructive: true,
            callback: async () => deleteNote(true),
          },
        ])
      }
      showActionSheet({
        title: note.title,
        options,
        anchor: elementRef.current ?? undefined,
      })
    }
  }

  const padding = 14
  const showPreview = !hidePreviews && !note.protected && !note.hidePreview
  const hasPlainPreview = !isNullOrUndefined(note.preview_plain) && note.preview_plain.length > 0
  const showDetails = !hideDates || note.protected

  const editorForNote = application?.componentManager.editorForNote(note)
  const [icon, tint] = application?.iconsController.getIconAndTintForNoteType(
    editorForNote?.package_info.note_type,
  ) as [IconType, number]

  return (
    <TouchableContainer
      onPress={_onPress}
      onPressIn={_onPressIn}
      onPressOut={_onPressOut}
      onLongPress={onLongPress}
      delayPressIn={150}
    >
      <Container ref={elementRef as any} selected={highlight} distance={padding}>
        {!hideEditorIcon && <SnIcon type={icon} fill={getTintColorForEditor(theme, tint)} style={styles.editorIcon} />}
        <NoteDataContainer distance={padding}>
          <NoteCellFlags note={note} highlight={highlight} />

          <FlexContainer>
            <NoteContentsContainer>
              {note.title.length > 0 ? <TitleText selected={highlight}>{note.title}</TitleText> : <View />}
              {hasPlainPreview && showPreview && (
                <NoteText selected={highlight} numberOfLines={2}>
                  {note.preview_plain}
                </NoteText>
              )}

              {!hasPlainPreview && showPreview && note.text.length > 0 && (
                <NoteText selected={highlight} numberOfLines={2}>
                  {note.text}
                </NoteText>
              )}
            </NoteContentsContainer>
            <NoteCellIconFlags note={note} />
          </FlexContainer>

          {showDetails && (
            <DetailsText numberOfLines={1} selected={highlight}>
              {note.protected && (
                <Text>
                  Protected
                  {!hideDates && ' • '}
                </Text>
              )}
              {!hideDates && (
                <Text>
                  {sortType === CollectionSort.UpdatedAt ? 'Modified ' + note.updatedAtString : note.createdAtString}
                </Text>
              )}
            </DetailsText>
          )}
        </NoteDataContainer>
      </Container>
    </TouchableContainer>
  )
}
