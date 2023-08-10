export type AnimationConfig = {
  keyframes: Keyframe[]
  reducedMotionKeyframes?: Keyframe[]
  options: KeyframeAnimationOptions
  initialStyle?: Partial<CSSStyleDeclaration>
}

export const TranslateFromTopAnimation: AnimationConfig = {
  keyframes: [
    {
      opacity: 0,
      transform: 'translateY(-100%)',
    },
    {
      opacity: 1,
      transform: 'translateY(0)',
    },
  ],
  options: {
    easing: 'ease-in-out',
    duration: 150,
    fill: 'forwards',
  },
  initialStyle: {
    transformOrigin: 'top',
  },
}

export const TranslateToTopAnimation: AnimationConfig = {
  keyframes: [
    {
      opacity: 1,
      transform: 'translateY(0)',
    },
    {
      opacity: 0,
      transform: 'translateY(-100%)',
    },
  ],
  options: {
    easing: 'ease-in-out',
    duration: 150,
    fill: 'forwards',
  },
  initialStyle: {
    transformOrigin: 'top',
  },
}

export const TranslateFromBelowAnimation: AnimationConfig = {
  keyframes: [
    {
      opacity: 0,
      transform: 'translateY(100%)',
    },
    {
      opacity: 1,
      transform: 'translateY(0)',
    },
  ],
  options: {
    easing: 'ease-in-out',
    duration: 150,
    fill: 'forwards',
  },
  initialStyle: {
    transformOrigin: 'bottom',
  },
}

export const TranslateToBelowAnimation: AnimationConfig = {
  keyframes: [
    {
      opacity: 1,
      transform: 'translateY(0)',
    },
    {
      opacity: 0,
      transform: 'translateY(100%)',
    },
  ],
  options: {
    easing: 'ease-in-out',
    duration: 150,
    fill: 'forwards',
  },
  initialStyle: {
    transformOrigin: 'bottom',
  },
}
