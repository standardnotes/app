import { ThemeServiceContext } from '@Style/ThemeService'
import React, { FC, RefObject, useCallback, useContext } from 'react'
import { Platform } from 'react-native'
import IosSearchBar from 'react-native-search-bar'
import AndroidSearchBar from 'react-native-search-box'
import { ThemeContext } from 'styled-components/native'
import { searchBarStyles } from './/SearchBar.styled'

type Props = {
  onChangeText: (text: string) => void
  onSearchCancel: () => void
  iosSearchBarInputRef: RefObject<IosSearchBar>
  androidSearchBarInputRef: RefObject<typeof AndroidSearchBar>
  onSearchFocusCallback?: () => void
  onSearchBlurCallback?: () => void
  collapseSearchBarOnBlur?: boolean
}

export const SearchBar: FC<Props> = ({
  onChangeText,
  onSearchCancel,
  iosSearchBarInputRef,
  androidSearchBarInputRef,
  onSearchFocusCallback,
  onSearchBlurCallback,
  collapseSearchBarOnBlur = true,
}) => {
  const theme = useContext(ThemeContext)
  const themeService = useContext(ThemeServiceContext)

  const onSearchFocus = useCallback(() => {
    onSearchFocusCallback?.()
  }, [onSearchFocusCallback])

  const onSearchBlur = useCallback(() => {
    onSearchBlurCallback?.()
  }, [onSearchBlurCallback])

  return (
    <>
      {Platform.OS === 'ios' && (
        <IosSearchBar
          ref={iosSearchBarInputRef}
          keyboardAppearance={themeService?.keyboardColorForActiveTheme()}
          placeholder="Search"
          hideBackground
          appearance={themeService?.keyboardColorForActiveTheme()}
          barTintColor={theme.stylekitInfoColor}
          textFieldBackgroundColor={theme.stylekitContrastBackgroundColor}
          onChangeText={onChangeText}
          onSearchButtonPress={() => {
            iosSearchBarInputRef.current?.blur()
          }}
          onCancelButtonPress={() => {
            iosSearchBarInputRef.current?.blur()
            onSearchCancel()
          }}
          onFocus={onSearchFocus}
          onBlur={onSearchBlur}
        />
      )}
      {Platform.OS === 'android' && (
        <AndroidSearchBar
          ref={androidSearchBarInputRef}
          onChangeText={onChangeText}
          onCancel={() => {
            onSearchBlur()
            onSearchCancel()
          }}
          onDelete={onSearchCancel}
          onFocus={onSearchFocus}
          onBlur={onSearchBlur}
          collapseOnBlur={collapseSearchBarOnBlur}
          blurOnSubmit={true}
          backgroundColor={theme.stylekitBackgroundColor}
          titleCancelColor={theme.stylekitInfoColor}
          keyboardDismissMode={'interactive'}
          keyboardAppearance={themeService?.keyboardColorForActiveTheme()}
          inputBorderRadius={4}
          tintColorSearch={theme.stylekitForegroundColor}
          inputStyle={[
            searchBarStyles.androidSearch,
            {
              color: theme.stylekitForegroundColor,
              backgroundColor: theme.stylekitContrastBackgroundColor,
            },
          ]}
          placeholderExpandedMargin={25}
          searchIconCollapsedMargin={30}
        />
      )}
    </>
  )
}
