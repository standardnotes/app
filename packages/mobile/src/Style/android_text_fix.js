import React from 'react'
import { Platform, StyleSheet, Text } from 'react-native'

export function enableAndroidFontFix() {
  // Bail if this isn't an Android device
  if (Platform.OS !== 'android') {
    return
  }

  const styles = StyleSheet.create({
    text: {
      fontFamily: 'Roboto',
    },
  })

  let __render = Text.render
  Text.render = function (...args) {
    let origin = __render.call(this, ...args)
    return React.cloneElement(origin, {
      style: [styles.text, origin.props.style],
    })
  }
}
