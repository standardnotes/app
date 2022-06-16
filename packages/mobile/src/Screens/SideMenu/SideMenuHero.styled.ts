import styled from 'styled-components/native'

export const Cell = styled.View`
  background-color: ${({ theme }) => theme.stylekitContrastBackgroundColor};
  border-bottom-color: ${({ theme }) => theme.stylekitContrastBorderColor};
  border-bottom-width: 1px;
  padding: 15px;
  padding-top: 10px;
  padding-bottom: 12px;
  padding-right: 25px;
`
export const Touchable = styled.TouchableOpacity``
export const Title = styled.Text`
  font-weight: bold;
  font-size: 16px;
  color: ${({ theme }) => theme.stylekitContrastForegroundColor};
  margin-bottom: 3px;
`
export const SubTitle = styled.Text`
  font-size: 13px;
  color: ${({ theme }) => theme.stylekitContrastForegroundColor};
  opacity: 0.6;
`
export const OutOfSyncContainer = styled.TouchableOpacity`
  flex: 1;
  margin-top: 5px;
  margin-bottom: 5px;
  flex-direction: row;
  align-items: center;
`
export const IconCircle = styled.View`
  margin-top: 10px;
  width: 15px;
`
export const OutOfSyncLabel = styled.Text`
  margin-top: 10px;
  font-size: 13px;
  height: 15px;
  color: ${({ theme }) => theme.stylekitWarningColor};
  font-weight: bold;
`
