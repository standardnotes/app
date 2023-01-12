export type AnimationConfig = {
  keyframes: Keyframe[]
  options: KeyframeAnimationOptions
  initialStyle?: Partial<CSSStyleDeclaration>
}

export const EnterFromTopAnimation: AnimationConfig = {
  keyframes: [
    {
      opacity: 0,
      transform: 'scaleY(0)',
    },
    {
      opacity: 1,
      transform: 'scaleY(1)',
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

export const EnterFromBelowAnimation: AnimationConfig = {
  keyframes: [
    {
      opacity: 0,
      transform: 'scaleY(0)',
    },
    {
      opacity: 1,
      transform: 'scaleY(1)',
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

export const ExitToTopAnimation: AnimationConfig = {
  keyframes: [
    {
      opacity: 1,
      transform: 'scaleY(1)',
    },
    {
      opacity: 0,
      transform: 'scaleY(0)',
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

export const ExitToBelowAnimation: AnimationConfig = {
  keyframes: [
    {
      opacity: 1,
      transform: 'scaleY(1)',
    },
    {
      opacity: 0,
      transform: 'scaleY(0)',
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
