import React, { useCallback, useEffect, useRef } from 'react'
import { Animated } from 'react-native'
import { TouchableWithoutFeedback } from 'react-native-gesture-handler'
import styled, { css } from 'styled-components/native'

type Props = {
  selected: boolean
  onPress: () => void
  label: string
  last?: boolean
}

const Container = styled.View<{
  last?: boolean
}>`
  border-radius: 100px;
  padding: 5px 10px;
  border-width: 1px;
  ${({ last }) =>
    !last &&
    css`
      margin-right: 8px;
    `};
`

const Label = styled.Text<{ selected: boolean }>`
  font-size: 14px;
`

const ActiveContainer = styled(Container)`
  background-color: ${({ theme }) => theme.stylekitInfoColor};
  border-color: ${({ theme }) => theme.stylekitInfoColor};
`

const InactiveContainer = styled(Container)`
  position: absolute;
  background-color: ${({ theme }) => theme.stylekitInfoContrastColor};
  border-color: ${({ theme }) => theme.stylekitBorderColor};
`

const ActiveLabel = styled(Label)`
  color: ${({ theme }) => theme.stylekitNeutralContrastColor};
`

const InactiveLabel = styled(Label)`
  color: ${({ theme }) => theme.stylekitNeutralColor};
`

export const Chip: React.FC<Props> = ({ selected, onPress, label, last }) => {
  const animationValue = useRef(new Animated.Value(selected ? 1 : 0)).current
  const selectedRef = useRef<boolean>(selected)

  const toggleChip = useCallback(() => {
    Animated.timing(animationValue, {
      toValue: selected ? 1 : 0,
      duration: 100,
      useNativeDriver: true,
    }).start()
  }, [animationValue, selected])

  useEffect(() => {
    if (selected !== selectedRef.current) {
      toggleChip()
      selectedRef.current = selected
    }
  }, [selected, toggleChip])

  return (
    <TouchableWithoutFeedback onPress={onPress}>
      <ActiveContainer
        as={Animated.View}
        last={last}
        style={{
          opacity: animationValue,
        }}
      >
        <ActiveLabel
          as={Animated.Text}
          selected={selected}
          style={{
            opacity: animationValue,
          }}
        >
          {label}
        </ActiveLabel>
      </ActiveContainer>
      <InactiveContainer
        as={Animated.View}
        last={last}
        style={{
          opacity: animationValue.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 0],
          }),
        }}
      >
        <InactiveLabel
          as={Animated.Text}
          selected={selected}
          style={{
            opacity: animationValue.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 0],
            }),
          }}
        >
          {label}
        </InactiveLabel>
      </InactiveContainer>
    </TouchableWithoutFeedback>
  )
}
