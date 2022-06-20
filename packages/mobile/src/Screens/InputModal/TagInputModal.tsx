import { useFocusEffect } from '@react-navigation/native'
import { ApplicationContext } from '@Root/ApplicationContext'
import { ButtonCell } from '@Root/Components/ButtonCell'
import { SectionedTableCell } from '@Root/Components/SectionedTableCell'
import { TableSection } from '@Root/Components/TableSection'
import { ModalStackNavigationProp } from '@Root/ModalStack'
import { SCREEN_INPUT_MODAL_TAG } from '@Root/Screens/screens'
import { SNNote, SNTag, TagMutator } from '@standardnotes/snjs'
import { ThemeServiceContext } from '@Style/ThemeService'
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react'
import { TextInput } from 'react-native'
import { Container, Input } from './InputModal.styled'

type Props = ModalStackNavigationProp<typeof SCREEN_INPUT_MODAL_TAG>
export const TagInputModal = (props: Props) => {
  // Context
  const application = useContext(ApplicationContext)
  const themeService = useContext(ThemeServiceContext)

  // State
  const [text, setText] = useState('')

  // Refs
  const textRef = useRef<TextInput>(null)

  useEffect(() => {
    if (props.route.params.tagUuid) {
      const tag = application?.items.findItem(props.route.params.tagUuid) as SNTag
      setText(tag.title)
    }
  }, [application, props.route.params.tagUuid])

  useFocusEffect(
    useCallback(() => {
      setTimeout(() => {
        textRef.current?.focus()
      }, 1)
    }, []),
  )

  const onSubmit = useCallback(async () => {
    if (props.route.params.tagUuid) {
      const tag = application?.items.findItem(props.route.params.tagUuid) as SNTag
      await application?.mutator.changeItem(tag, (mutator) => {
        const tagMutator = mutator as TagMutator
        tagMutator.title = text
        if (props.route.params.noteUuid) {
          const note = application.items.findItem(props.route.params.noteUuid)
          if (note) {
            tagMutator.addNote(note as SNNote)
          }
        }
      })
    } else {
      const tag = await application!.mutator.findOrCreateTag(text)
      if (props.route.params.noteUuid) {
        await application?.mutator.changeItem(tag, (mutator) => {
          const tagMutator = mutator as TagMutator
          const note = application.items.findItem(props.route.params.noteUuid!)
          if (note) {
            tagMutator.addNote(note as SNNote)
          }
        })
      }
    }

    void application?.sync.sync()
    props.navigation.goBack()
  }, [application, props.navigation, props.route.params.noteUuid, props.route.params.tagUuid, text])

  return (
    <Container>
      <TableSection>
        <SectionedTableCell textInputCell first={true}>
          <Input
            ref={textRef as any}
            placeholder={props.route.params.tagUuid ? 'Tag name' : 'New tag name'}
            onChangeText={setText}
            value={text}
            autoCorrect={false}
            autoCapitalize={'none'}
            keyboardAppearance={themeService?.keyboardColorForActiveTheme()}
            underlineColorAndroid={'transparent'}
            onSubmitEditing={onSubmit}
          />
        </SectionedTableCell>

        <ButtonCell maxHeight={45} disabled={text.length === 0} title={'Save'} bold onPress={onSubmit} />
      </TableSection>
    </Container>
  )
}
