import SNTextView from '@standardnotes/react-native-textview'
import React, { ComponentProps } from 'react'
import { Platform } from 'react-native'
import styled, { css } from 'styled-components/native'

const PADDING = 14
const NOTE_TITLE_HEIGHT = 50

export const Container = styled.View`
  flex: 1;
  background-color: ${({ theme }) => theme.stylekitBackgroundColor};
`
export const LockedContainer = styled.View`
  justify-content: flex-start;
  flex-direction: row;
  align-items: center;
  padding-left: ${PADDING}px;
  padding: 8px;
  background-color: ${({ theme }) => theme.stylekitNeutralColor};
  border-bottom-color: ${({ theme }) => theme.stylekitBorderColor};
  border-bottom-width: 1px;
`
export const LockedText = styled.Text`
  font-weight: bold;
  font-size: 12px;
  color: ${({ theme }) => theme.stylekitBackgroundColor};
  padding-left: 10px;
  padding-right: 100px;
`
export const WebViewReloadButton = styled.TouchableOpacity`
  position: absolute;
  right: ${PADDING}px;
  height: 100%;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`
export const WebViewReloadButtonText = styled.Text`
  color: ${({ theme }) => theme.stylekitBackgroundColor};
  font-size: 12px;
  font-weight: bold;
`
export const NoteTitleInput = styled.TextInput`
  font-weight: ${Platform.OS === 'ios' ? 600 : 'bold'};
  font-size: ${Platform.OS === 'ios' ? 17 : 18}px;
  color: ${({ theme }) => theme.stylekitForegroundColor};
  background-color: ${({ theme }) => theme.stylekitBackgroundColor};
  height: ${NOTE_TITLE_HEIGHT}px;
  border-bottom-color: ${({ theme }) => theme.stylekitBorderColor};
  border-bottom-width: 1px;
  padding-top: ${Platform.OS === 'ios' ? 5 : 12}px;
  padding-left: ${PADDING}px;
  padding-right: ${PADDING}px;
`
export const LoadingWebViewContainer = styled.View<{ locked?: boolean }>`
  position: absolute;
  height: 100%;
  width: 100%;
  top: ${({ locked }) => (locked ? NOTE_TITLE_HEIGHT + 26 : NOTE_TITLE_HEIGHT)}px;
  bottom: 0px;
  z-index: 300;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${({ theme }) => theme.stylekitBackgroundColor};
`
export const LoadingText = styled.Text`
  padding-left: 0px;
  color: ${({ theme }) => theme.stylekitForegroundColor};
  opacity: 0.7;
  margin-top: 5px;
`
export const ContentContainer = styled.View`
  flex-grow: 1;
`
export const TextContainer = styled.View`
  flex: 1;
`
export const StyledKeyboardAvoidngView = styled.KeyboardAvoidingView`
  flex: 1;
  ${({ theme }) => theme.stylekitBackgroundColor};
`

const StyledTextViewComponent = styled(SNTextView)<{ errorState: boolean }>`
  padding-top: 10px;
  color: ${({ theme }) => theme.stylekitForegroundColor};
  padding-left: ${({ theme }) => theme.paddingLeft - (Platform.OS === 'ios' ? 5 : 0)}px;
  padding-right: ${({ theme }) => theme.paddingLeft - (Platform.OS === 'ios' ? 5 : 0)}px;
  padding-bottom: ${({ errorState }) => (errorState ? 36 : 10)}px;
  ${Platform.OS === 'ios' &&
  css`
    height: 96%;
  `}
  ${Platform.OS === 'android' &&
  css`
    flex: 1;
  `}
  background-color: ${({ theme }) => theme.stylekitBackgroundColor};
  /* ${Platform.OS === 'ios' && 'padding-bottom: 10px'}; */
`

export const StyledTextView = React.memo(
  StyledTextViewComponent,
  (newProps: ComponentProps<typeof SNTextView>, prevProps: ComponentProps<typeof SNTextView>) => {
    if (
      newProps.value !== prevProps.value ||
      newProps.selectionColor !== prevProps.selectionColor ||
      newProps.handlesColor !== prevProps.handlesColor ||
      newProps.autoFocus !== prevProps.autoFocus ||
      newProps.editable !== prevProps.editable ||
      newProps.keyboardDismissMode !== prevProps.keyboardDismissMode ||
      newProps.keyboardAppearance !== prevProps.keyboardAppearance ||
      newProps.testID !== prevProps.testID ||
      newProps.multiline !== prevProps.multiline
    ) {
      return false
    }
    return true
  },
)
