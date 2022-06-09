import { associateComponentWithNote } from '@Lib/ComponentManager'
import { useChangeNote, useDeleteNoteWithPrivileges, useProtectOrUnprotectNote } from '@Lib/SnjsHelperHooks'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import { AppStackNavigationProp } from '@Root/AppStack'
import { useSafeApplicationContext } from '@Root/Hooks/useSafeApplicationContext'
import { SCREEN_COMPOSE, SCREEN_INPUT_MODAL_TAG, SCREEN_NOTE_HISTORY } from '@Root/Screens/screens'
import { Files } from '@Root/Screens/SideMenu/Files'
import { Listed } from '@Root/Screens/SideMenu/Listed'
import { FeatureIdentifier, FindNativeFeature } from '@standardnotes/features'
import {
  ApplicationEvent,
  ButtonType,
  ComponentArea,
  ComponentMutator,
  ContentType,
  FeatureStatus,
  NoteMutator,
  NoteViewController,
  PayloadEmitSource,
  PrefKey,
  SmartView,
  SNComponent,
  SNNote,
  SNTag,
} from '@standardnotes/snjs'
import { useCustomActionSheet } from '@Style/CustomActionSheet'
import {
  ICON_ARCHIVE,
  ICON_BOOKMARK,
  ICON_FINGER_PRINT,
  ICON_HISTORY,
  ICON_LOCK,
  ICON_MEDICAL,
  ICON_PRICE_TAG,
  ICON_SHARE,
  ICON_TRASH,
} from '@Style/Icons'
import { ThemeService } from '@Style/ThemeService'
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { Platform, Share } from 'react-native'
import FAB from 'react-native-fab'
import { FlatList } from 'react-native-gesture-handler'
import DrawerLayout from 'react-native-gesture-handler/DrawerLayout'
import Icon from 'react-native-vector-icons/Ionicons'
import { ThemeContext } from 'styled-components'
import { SafeAreaContainer, useStyles } from './NoteSideMenu.styled'
import { SideMenuOption, SideMenuOptionIconDescriptionType, SideMenuSection } from './SideMenuSection'
import { TagSelectionList } from './TagSelectionList'

function sortAlphabetically(array: SNComponent[]): SNComponent[] {
  return array.sort((a, b) => {
    const aName = FindNativeFeature(a.identifier)?.name || a.name
    const bName = FindNativeFeature(b.identifier)?.name || b.name
    return aName.toLowerCase() < bName.toLowerCase() ? -1 : 1
  })
}

type Props = {
  drawerRef: DrawerLayout | null
  drawerOpen: boolean
}

function useEditorComponents(): SNComponent[] {
  const application = useSafeApplicationContext()
  const [components, setComponents] = useState<SNComponent[]>([])
  useEffect(() => {
    const removeComponentsObserver = application.streamItems(ContentType.Component, () => {
      const displayComponents = sortAlphabetically(application.componentManager.componentsForArea(ComponentArea.Editor))
      setComponents(displayComponents)
    })
    return () => {
      if (application) {
        removeComponentsObserver()
      }
    }
  }, [application])

  return components
}

export const NoteSideMenu = React.memo((props: Props) => {
  // Context
  const theme = useContext(ThemeContext)
  const application = useSafeApplicationContext()

  const navigation = useNavigation<AppStackNavigationProp<typeof SCREEN_COMPOSE>['navigation']>()
  const { showActionSheet } = useCustomActionSheet()
  const styles = useStyles(theme)

  // State
  const [editor, setEditor] = useState<NoteViewController | undefined>(undefined)
  const [note, setNote] = useState<SNNote | undefined>(undefined)
  const [selectedTags, setSelectedTags] = useState<SNTag[]>([])
  const [attachedFilesLength, setAttachedFilesLength] = useState(0)

  const [shouldAddTagHierarchy, setShouldAddTagHierachy] = useState(() =>
    application.getPreference(PrefKey.NoteAddToParentFolders, true),
  )

  useEffect(() => {
    const removeEventObserver = application.addSingleEventObserver(ApplicationEvent.PreferencesChanged, async () => {
      setShouldAddTagHierachy(application.getPreference(PrefKey.NoteAddToParentFolders, true))
    })

    return () => {
      removeEventObserver()
    }
  }, [application])

  const components = useEditorComponents()

  const [changeNote] = useChangeNote(note, editor)
  const [protectOrUnprotectNote] = useProtectOrUnprotectNote(note, editor)

  const [deleteNote] = useDeleteNoteWithPrivileges(
    note!,
    async () => {
      await application.mutator.deleteItem(note!)
      props.drawerRef?.closeDrawer()
      if (!application.getAppState().isInTabletMode) {
        navigation.popToTop()
      }
    },
    () => {
      void changeNote(mutator => {
        mutator.trashed = true
      }, false)
      props.drawerRef?.closeDrawer()
      if (!application.getAppState().isInTabletMode) {
        navigation.popToTop()
      }
    },
    editor,
  )

  useEffect(() => {
    if (!note) {
      setAttachedFilesLength(0)
      return
    }
    setAttachedFilesLength(application.items.getFilesForNote(note).length)
  }, [application, note])

  useEffect(() => {
    if (!note) {
      return
    }
    const removeFilesObserver = application.streamItems(ContentType.File, () => {
      setAttachedFilesLength(application.items.getFilesForNote(note).length)
    })
    return () => {
      removeFilesObserver()
    }
  }, [application, note])

  useEffect(() => {
    let mounted = true
    if ((!editor || props.drawerOpen) && mounted) {
      const initialEditor = application.editorGroup.activeNoteViewController
      const tempNote = initialEditor?.note
      setEditor(initialEditor)
      setNote(tempNote)
    }
    return () => {
      mounted = false
    }
  }, [application, editor, props.drawerOpen])

  useEffect(() => {
    let mounted = true
    const removeEditorObserver = application.editorGroup.addActiveControllerChangeObserver(() => {
      if (mounted) {
        const activeController = application.editorGroup.activeNoteViewController
        setNote(activeController?.note)
        setEditor(activeController)
      }
    })

    return () => {
      mounted = false
      removeEditorObserver && removeEditorObserver()
    }
  }, [application])

  const reloadTags = useCallback(() => {
    if (note) {
      const tags = application.getAppState().getNoteTags(note)
      setSelectedTags(tags)
    }
  }, [application, note])

  useEffect(() => {
    let mounted = true
    const removeObserver = editor?.addNoteInnerValueChangeObserver((newNote, source) => {
      if (mounted && props.drawerOpen) {
        if (source !== PayloadEmitSource.ComponentRetrieved) {
          setNote(newNote)
        }
      }
    })
    return () => {
      if (removeObserver) {
        removeObserver()
      }
      mounted = false
    }
  }, [editor, note?.uuid, props.drawerOpen, reloadTags])

  useEffect(() => {
    let isMounted = true
    const removeTagsObserver = application.streamItems(ContentType.Tag, () => {
      if (!note) {
        return
      }
      if (isMounted && props.drawerOpen) {
        reloadTags()
      }
      return () => {
        isMounted = false
        removeTagsObserver && removeTagsObserver()
      }
    })
  }, [application, note, props.drawerOpen, reloadTags])

  const disassociateComponentWithCurrentNote = useCallback(
    async (component: SNComponent) => {
      if (note) {
        return application.mutator.changeItem(component, m => {
          const mutator = m as ComponentMutator
          mutator.removeAssociatedItemId(note.uuid)
          mutator.disassociateWithItem(note.uuid)
        })
      }
      return
    },
    [application, note],
  )

  const onEditorPress = useCallback(
    async (selectedComponent?: SNComponent) => {
      if (!note) {
        return
      }
      if (note?.locked) {
        void application.alertService.alert(
          "This note has editing disabled. If you'd like to edit its options, enable editing on it, and try again.",
        )
        return
      }
      if (editor?.isTemplateNote) {
        await editor?.insertTemplatedNote()
      }
      const activeEditorComponent = application.componentManager.editorForNote(note)
      props.drawerRef?.closeDrawer()
      if (!selectedComponent) {
        if (!note?.prefersPlainEditor) {
          await application.mutator.changeItem(
            note,
            mutator => {
              const noteMutator = mutator as NoteMutator
              noteMutator.prefersPlainEditor = true
            },
            false,
          )
        }
        if (activeEditorComponent?.isExplicitlyEnabledForItem(note.uuid) || activeEditorComponent?.isMobileDefault) {
          await disassociateComponentWithCurrentNote(activeEditorComponent)
        }
      } else if (selectedComponent.area === ComponentArea.Editor) {
        const currentEditor = activeEditorComponent
        if (currentEditor && selectedComponent !== currentEditor) {
          await disassociateComponentWithCurrentNote(currentEditor)
        }
        const prefersPlain = note.prefersPlainEditor
        if (prefersPlain) {
          await application.mutator.changeItem(
            note,
            mutator => {
              const noteMutator = mutator as NoteMutator
              noteMutator.prefersPlainEditor = false
            },
            false,
          )
        }
        await associateComponentWithNote(application, selectedComponent, note)
      }
      /** Dirtying can happen above */
      void application.sync.sync()
    },
    [application, disassociateComponentWithCurrentNote, editor, note, props.drawerRef],
  )

  const onEdtiorLongPress = useCallback(
    async (component?: SNComponent) => {
      const currentDefault = application.componentManager
        .componentsForArea(ComponentArea.Editor)
        .filter(e => e.isMobileDefault)[0]

      let isDefault = false
      if (!component) {
        // System editor
        if (currentDefault) {
          isDefault = false
        }
      } else {
        isDefault = component.isMobileDefault
      }

      let action = isDefault ? 'Remove as Mobile Default' : 'Set as Mobile Default'
      if (!component && !currentDefault) {
        // Long pressing on plain editor while it is default, no actions available
        action = 'Is Mobile Default'
      }

      const setAsDefault = () => {
        if (currentDefault) {
          void application.mutator.changeItem(currentDefault, m => {
            const mutator = m as ComponentMutator
            mutator.isMobileDefault = false
          })
        }

        if (component) {
          void application.mutator.changeAndSaveItem(component, m => {
            const mutator = m as ComponentMutator
            mutator.isMobileDefault = true
          })
        }
      }

      const removeAsDefault = () => {
        void application.mutator.changeItem(currentDefault, m => {
          const mutator = m as ComponentMutator
          mutator.isMobileDefault = false
        })
      }

      showActionSheet({
        title: component?.name ?? 'Plain text',
        options: [
          {
            text: action,
            callback: () => {
              if (!component) {
                setAsDefault()
              } else {
                if (isDefault) {
                  removeAsDefault()
                } else {
                  setAsDefault()
                }
              }
            },
          },
        ],
      })
    },
    [application, showActionSheet],
  )

  const editors = useMemo(() => {
    if (!note) {
      return []
    }
    const componentEditor = application.componentManager.editorForNote(note)
    const options: SideMenuOption[] = [
      {
        text: 'Plain text',
        key: 'plain-editor',
        selected: !componentEditor,
        onSelect: () => {
          void onEditorPress(undefined)
        },
        onLongPress: () => {
          void onEdtiorLongPress(undefined)
        },
      },
    ]
    components.map(component => {
      options.push({
        text: FindNativeFeature(component.identifier)?.name || component.name,
        subtext: component.isMobileDefault ? 'Mobile Default' : undefined,
        key: component.uuid || component.name,
        selected: component.uuid === componentEditor?.uuid,
        onSelect: () => {
          void onEditorPress(component)
        },
        onLongPress: () => {
          void onEdtiorLongPress(component)
        },
      })
    })
    if (options.length === 1) {
      options.push({
        text: 'Unlock More Types',
        key: 'get-editors',
        iconDesc: {
          type: SideMenuOptionIconDescriptionType.Icon,
          name: ThemeService.nameForIcon(ICON_MEDICAL),
          side: 'right',
          size: 17,
        },
        onSelect: () => {
          application.deviceInterface?.openUrl('https://standardnotes.com/plans')
        },
      })
    }
    return options
  }, [note, application, components, onEditorPress, onEdtiorLongPress])

  useFocusEffect(
    useCallback(() => {
      let mounted = true
      if (mounted) {
        reloadTags()
      }

      return () => {
        mounted = false
      }
    }, [reloadTags]),
  )

  const leaveEditor = useCallback(() => {
    props.drawerRef?.closeDrawer()
    navigation.goBack()
  }, [props.drawerRef, navigation])

  const isEntitledToFiles = application.features.getFeatureStatus(FeatureIdentifier.Files) === FeatureStatus.Entitled

  const noteOptions = useMemo(() => {
    if (!note) {
      return
    }

    const pinOption = note.pinned ? 'Unpin' : 'Pin'
    const pinEvent = () =>
      changeNote(mutator => {
        mutator.pinned = !note.pinned
      }, false)

    const archiveOption = note.archived ? 'Unarchive' : 'Archive'
    const archiveEvent = () => {
      if (note.locked) {
        void application.alertService.alert(
          `This note has editing disabled. If you'd like to ${archiveOption.toLowerCase()} it, enable editing on it, and try again.`,
        )
        return
      }
      void changeNote(mutator => {
        mutator.archived = !note.archived
      }, false)
      leaveEditor()
    }

    const lockOption = note.locked ? 'Enable editing' : 'Prevent editing'
    const lockEvent = () =>
      changeNote(mutator => {
        mutator.locked = !note.locked
      }, false)

    const protectOption = note.protected ? 'Remove password protection' : 'Password protect'
    const protectEvent = async () => await protectOrUnprotectNote()

    const openSessionHistory = () => {
      if (!editor?.isTemplateNote) {
        props.drawerRef?.closeDrawer()
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        navigation.navigate('HistoryStack', {
          screen: SCREEN_NOTE_HISTORY,
          params: { noteUuid: note.uuid },
        })
      }
    }

    const shareNote = () => {
      if (note) {
        void application.getAppState().performActionWithoutStateChangeImpact(() => {
          void Share.share({
            title: note.title,
            message: note.text,
          })
        })
      }
    }

    const rawOptions = [
      { text: pinOption, onSelect: pinEvent, icon: ICON_BOOKMARK },
      { text: archiveOption, onSelect: archiveEvent, icon: ICON_ARCHIVE },
      { text: lockOption, onSelect: lockEvent, icon: ICON_LOCK },
      { text: protectOption, onSelect: protectEvent, icon: ICON_FINGER_PRINT },
      {
        text: 'History',
        onSelect: openSessionHistory,
        icon: ICON_HISTORY,
      },
      { text: 'Share', onSelect: shareNote, icon: ICON_SHARE },
    ]

    if (!note.trashed) {
      rawOptions.push({
        text: 'Move to Trash',
        onSelect: async () => deleteNote(false),
        icon: ICON_TRASH,
      })
    }

    let options: SideMenuOption[] = rawOptions.map(rawOption => ({
      text: rawOption.text,
      key: rawOption.icon,
      iconDesc: {
        type: SideMenuOptionIconDescriptionType.Icon,
        side: 'right' as const,
        name: ThemeService.nameForIcon(rawOption.icon),
      },
      onSelect: rawOption.onSelect,
    }))

    if (note.trashed) {
      options = options.concat([
        {
          text: 'Restore',
          key: 'restore-note',
          onSelect: () => {
            void changeNote(mutator => {
              mutator.trashed = false
            }, false)
          },
        },
        {
          text: 'Delete permanently',
          textClass: 'danger' as const,
          key: 'delete-forever',
          onSelect: async () => deleteNote(true),
        },
        {
          text: 'Empty Trash',
          textClass: 'danger' as const,
          key: 'empty trash',
          onSelect: async () => {
            const count = application.items.trashedItems.length
            const confirmed = await application.alertService?.confirm(
              `Are you sure you want to permanently delete ${count} notes?`,
              'Empty Trash',
              'Delete',
              ButtonType.Danger,
            )
            if (confirmed) {
              await application.mutator.emptyTrash()
              props.drawerRef?.closeDrawer()
              if (!application.getAppState().isInTabletMode) {
                navigation.popToTop()
              }
              void application.sync.sync()
            }
          },
        },
      ])
    }

    return options
  }, [
    application,
    changeNote,
    deleteNote,
    editor?.isTemplateNote,
    leaveEditor,
    navigation,
    note,
    props.drawerRef,
    protectOrUnprotectNote,
  ])

  const onTagSelect = useCallback(
    async (tag: SNTag | SmartView, addTagHierachy: boolean) => {
      const isSelected = selectedTags.findIndex(selectedTag => selectedTag.uuid === tag.uuid) > -1

      if (note) {
        if (isSelected) {
          await application.mutator.changeItem(tag, mutator => {
            mutator.removeItemAsRelationship(note)
          })
        } else {
          await application.items.addTagToNote(note, tag as SNTag, addTagHierachy)
        }
      }
      reloadTags()
      void application.sync.sync()
    },
    [application, note, reloadTags, selectedTags],
  )

  if (!editor || !note) {
    return null
  }

  enum MenuSections {
    FilesSection = 'files-section',
    OptionsSection = 'options-section',
    EditorsSection = 'editors-section',
    ListedSection = 'listed-section',
    TagsSection = 'tags-section',
  }

  return (
    <SafeAreaContainer edges={['top', 'bottom', 'right']}>
      <FlatList
        style={styles.sections}
        data={Object.values(MenuSections).map(key => ({
          key,
          noteOptions,
          editorComponents: editors,
          onTagSelect,
          selectedTags,
        }))}
        renderItem={({ item }) => {
          const { OptionsSection, EditorsSection, ListedSection, TagsSection, FilesSection } = MenuSections

          if (item.key === FilesSection) {
            let collapsedLabel = 'Tap to expand'

            if (isEntitledToFiles) {
              collapsedLabel = `${attachedFilesLength ? `${attachedFilesLength}` : 'No'} attached file${
                attachedFilesLength === 1 ? '' : 's'
              }`
            }
            return (
              <SideMenuSection title={'Files'} customCollapsedLabel={collapsedLabel} collapsed={false}>
                <Files note={note} />
              </SideMenuSection>
            )
          }
          if (item.key === OptionsSection) {
            return <SideMenuSection title="Options" options={item.noteOptions} />
          }
          if (item.key === EditorsSection) {
            return <SideMenuSection title="Note Type" options={item.editorComponents} collapsed={true} />
          }
          if (item.key === ListedSection) {
            return (
              <SideMenuSection title="Listed" collapsed={true}>
                <Listed note={note} />
              </SideMenuSection>
            )
          }
          if (item.key === TagsSection) {
            return (
              <SideMenuSection title="Tags">
                <TagSelectionList
                  hasBottomPadding={Platform.OS === 'android'}
                  contentType={ContentType.Tag}
                  onTagSelect={tag => item.onTagSelect(tag, shouldAddTagHierarchy)}
                  selectedTags={item.selectedTags}
                  emptyPlaceholder={'Create a new tag using the tag button in the bottom right corner.'}
                />
              </SideMenuSection>
            )
          }
          return null
        }}
      />

      <FAB
        buttonColor={theme.stylekitInfoColor}
        iconTextColor={theme.stylekitInfoContrastColor}
        onClickAction={() => navigation.navigate(SCREEN_INPUT_MODAL_TAG, { noteUuid: note.uuid })}
        visible={true}
        size={30}
        iconTextComponent={<Icon name={ThemeService.nameForIcon(ICON_PRICE_TAG)} />}
      />
    </SafeAreaContainer>
  )
})
