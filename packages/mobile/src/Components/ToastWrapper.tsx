import { useToastStyles } from '@Components/ToastWrapper.styled'
import { useProgressBar } from '@Root/Hooks/useProgessBar'
import React, { FC, useContext } from 'react'
import { Animated, StyleSheet, View } from 'react-native'
import Toast, { ErrorToast, InfoToast, SuccessToast, ToastConfig } from 'react-native-toast-message'
import { ThemeContext } from 'styled-components'

export const ToastWrapper: FC = () => {
  const theme = useContext(ThemeContext)
  const styles = useToastStyles(theme)

  const { updateProgressBar, progressBarWidth } = useProgressBar()

  const toastStyles: ToastConfig = {
    info: props => {
      const percentComplete = props.props?.percentComplete || 0
      updateProgressBar(percentComplete)

      return (
        <View>
          <InfoToast {...props} style={styles(props.props).info} />
          {props.props?.percentComplete !== undefined ? (
            <View style={[styles(props.props).animatedViewContainer]}>
              <Animated.View
                style={[
                  StyleSheet.absoluteFill,
                  {
                    ...styles(props.props).animatedView,
                    width: progressBarWidth,
                  },
                ]}
              />
            </View>
          ) : null}
        </View>
      )
    },
    success: props => {
      const percentComplete = props.props?.percentComplete || 0
      updateProgressBar(percentComplete)

      return <SuccessToast {...props} style={styles(props.props).success} />
    },
    error: props => {
      const percentComplete = props.props?.percentComplete || 0
      updateProgressBar(percentComplete)

      return <ErrorToast {...props} style={styles(props.props).error} />
    },
  }

  return <Toast config={toastStyles} />
}
