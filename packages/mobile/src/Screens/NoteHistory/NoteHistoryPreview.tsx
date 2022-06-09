import { ApplicationContext } from '@Root/ApplicationContext'
import { IoniconsHeaderButton } from '@Root/Components/IoniconsHeaderButton'
import { HistoryStackNavigationProp } from '@Root/HistoryStack'
import { SCREEN_COMPOSE, SCREEN_NOTES, SCREEN_NOTE_HISTORY_PREVIEW } from '@Root/Screens/screens'
import { ButtonType, PayloadEmitSource, SNNote } from '@standardnotes/snjs'
import { useCustomActionSheet } from '@Style/CustomActionSheet'
import { ELIPSIS } from '@Style/Icons'
import { ThemeService } from '@Style/ThemeService'
import React, { useCallback, useContext, useLayoutEffect } from 'react'
import { LogBox } from 'react-native'
import { HeaderButtons, Item } from 'react-navigation-header-buttons'
import { Container, StyledTextView, TextContainer, Title, TitleContainer } from './NoteHistoryPreview.styled'

LogBox.ignoreLogs(['Non-serializable values were found in the navigation state'])

type Props = HistoryStackNavigationProp<typeof SCREEN_NOTE_HISTORY_PREVIEW>
export const NoteHistoryPreview = ({
  navigation,
  route: {
    params: { revision, title, originalNoteUuid },
  },
}: Props) => {
  // Context
  const application = useContext(ApplicationContext)
  const { showActionSheet } = useCustomActionSheet()

  // State

  const restore = useCallback(
    async (asCopy: boolean) => {
      const originalNote = application!.items.findSureItem<SNNote>(originalNoteUuid)

      const run = async () => {
        if (asCopy) {
          await application?.mutator.duplicateItem(originalNote!, {
            ...revision.payload.content,
            title: revision.payload.content.title ? revision.payload.content.title + ' (copy)' : undefined,
          })

          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-expect-error
          navigation.navigate(SCREEN_NOTES)
        } else {
          await application?.mutator.changeAndSaveItem(
            originalNote,
            mutator => {
              mutator.setCustomContent(revision.payload.content)
            },
            true,
            PayloadEmitSource.RemoteRetrieved,
          )
          if (application?.getAppState().isTabletDevice) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            navigation.navigate(SCREEN_NOTES)
          } else {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            navigation.navigate(SCREEN_COMPOSE)
          }
        }
      }

      if (!asCopy) {
        if (originalNote.locked) {
          void application?.alertService.alert(
            "This note has editing disabled. If you'd like to restore it to a previous revision, enable editing and try again.",
          )
          return
        }
        const confirmed = await application?.alertService?.confirm(
          "Are you sure you want to replace the current note's contents with what you see in this preview?",
          'Restore note',
          'Restore',
          ButtonType.Info,
        )
        if (confirmed) {
          void run()
        }
      } else {
        void run()
      }
    },
    [application, navigation, originalNoteUuid, revision.payload.content],
  )

  const onPress = useCallback(() => {
    showActionSheet({
      title: title!,
      options: [
        {
          text: 'Restore',
          callback: () => restore(false),
        },
        {
          text: 'Restore as copy',
          callback: async () => restore(true),
        },
      ],
    })
  }, [showActionSheet, title, restore])

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <HeaderButtons HeaderButtonComponent={IoniconsHeaderButton}>
          <Item
            testID="notePreviewOptions"
            disabled={false}
            iconSize={25}
            title={''}
            iconName={ThemeService.nameForIcon(ELIPSIS)}
            onPress={onPress}
          />
        </HeaderButtons>
      ),
    })
  }, [navigation, onPress])

  return (
    <Container>
      <TitleContainer>
        <Title testID="notePreviewTitleField">{revision.payload.content.title}</Title>
      </TitleContainer>

      <TextContainer>
        <StyledTextView testID="notePreviewText">{revision.payload.content.text}</StyledTextView>
      </TextContainer>
    </Container>
  )
}
