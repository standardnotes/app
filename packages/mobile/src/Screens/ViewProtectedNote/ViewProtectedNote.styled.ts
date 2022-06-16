import styled from 'styled-components/native'

export const Container = styled.View`
  flex: 1;
  background-color: ${({ theme }) => theme.stylekitBackgroundColor};
  display: flex;
  justify-content: center;
  padding: 20px;
`

export const Title = styled.Text`
  font-size: 20px;
  font-weight: bold;
  text-align: center;
  color: ${({ theme }) => theme.stylekitForegroundColor};
`

export const Text = styled.Text`
  margin: 8px 0 24px;
  font-size: 14px;
  text-align: center;
  color: ${({ theme }) => theme.stylekitParagraphTextColor};
`
