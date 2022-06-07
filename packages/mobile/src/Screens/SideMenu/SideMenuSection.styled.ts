import styled from 'styled-components/native'

export const Root = styled.View`
  padding-bottom: 6px;
`
export const Header = styled.TouchableOpacity<{ collapsed: boolean }>`
  height: ${props => (props.collapsed ? 50 : 22)}px;
`
export const Title = styled.Text`
  color: ${({ theme }) => theme.stylekitInfoColor};
  font-size: 13px;
  font-weight: 700;
`
export const CollapsedLabel = styled.Text`
  font-size: 12px;
  opacity: 0.7;
  margin-top: 3px;
  color: ${({ theme }) => theme.stylekitContrastForegroundColor};
`
