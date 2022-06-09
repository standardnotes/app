import { SectionedAccessoryTableCell } from '@Root/Components/SectionedAccessoryTableCell'
import { SectionHeader } from '@Root/Components/SectionHeader'
import { TableSection } from '@Root/Components/TableSection'
import { useSafeApplicationContext } from '@Root/Hooks/useSafeApplicationContext'
import { CollectionSort, CollectionSortProperty, PrefKey } from '@standardnotes/snjs'
import React, { useMemo, useState } from 'react'

export const PreferencesSection = () => {
  // Context
  const application = useSafeApplicationContext()

  // State
  const [sortBy, setSortBy] = useState<CollectionSortProperty>(() =>
    application.getPreference(PrefKey.MobileSortNotesBy, CollectionSort.CreatedAt),
  )
  const [sortReverse, setSortReverse] = useState<boolean>(() =>
    application.getLocalPreferences().getValue(PrefKey.MobileSortNotesReverse, false),
  )
  const [hideDates, setHideDates] = useState<boolean>(() =>
    application.getLocalPreferences().getValue(PrefKey.MobileNotesHideDate, false),
  )
  const [hideEditorIcon, setHideEditorIcon] = useState<boolean>(() =>
    application.getLocalPreferences().getValue(PrefKey.MobileNotesHideEditorIcon, false),
  )
  const [hidePreviews, setHidePreviews] = useState<boolean>(() =>
    application.getLocalPreferences().getValue(PrefKey.MobileNotesHideNotePreview, false),
  )

  const sortOptions = useMemo(() => {
    return [
      { key: CollectionSort.CreatedAt, label: 'Date Added' },
      { key: CollectionSort.UpdatedAt, label: 'Date Modified' },
      { key: CollectionSort.Title, label: 'Title' },
    ]
  }, [])

  const toggleReverseSort = () => {
    void application.getLocalPreferences().setUserPrefValue(PrefKey.MobileSortNotesReverse, !sortReverse)
    setSortReverse(value => !value)
  }

  const changeSortOption = (key: CollectionSortProperty) => {
    void application.getLocalPreferences().setUserPrefValue(PrefKey.MobileSortNotesBy, key)
    setSortBy(key)
  }
  const toggleNotesPreviewHidden = () => {
    void application.getLocalPreferences().setUserPrefValue(PrefKey.MobileNotesHideNotePreview, !hidePreviews)
    setHidePreviews(value => !value)
  }
  const toggleNotesDateHidden = () => {
    void application.getLocalPreferences().setUserPrefValue(PrefKey.MobileNotesHideDate, !hideDates)
    setHideDates(value => !value)
  }
  const toggleNotesEditorIconHidden = () => {
    void application.getLocalPreferences().setUserPrefValue(PrefKey.MobileNotesHideEditorIcon, !hideEditorIcon)
    setHideEditorIcon(value => !value)
  }

  return (
    <>
      <TableSection>
        <SectionHeader
          title={'Sort Notes By'}
          buttonText={sortReverse ? 'Disable Reverse Sort' : 'Enable Reverse Sort'}
          buttonAction={toggleReverseSort}
        />
        {sortOptions.map((option, i) => {
          return (
            <SectionedAccessoryTableCell
              onPress={() => {
                changeSortOption(option.key)
              }}
              text={option.label}
              key={option.key}
              first={i === 0}
              last={i === sortOptions.length - 1}
              selected={() => option.key === sortBy}
            />
          )
        })}
      </TableSection>

      <TableSection>
        <SectionHeader title={'Note List Options'} />

        <SectionedAccessoryTableCell
          onPress={toggleNotesPreviewHidden}
          text={'Hide note previews'}
          first
          selected={() => hidePreviews}
        />

        <SectionedAccessoryTableCell
          onPress={toggleNotesDateHidden}
          text={'Hide note dates'}
          selected={() => hideDates}
        />

        <SectionedAccessoryTableCell
          onPress={toggleNotesEditorIconHidden}
          text={'Hide editor icons'}
          last
          selected={() => hideEditorIcon}
        />
      </TableSection>
    </>
  )
}
