export const calculateReadTime = (words: number) => {
  const timeToRead = Math.round(words / 200)
  if (timeToRead === 0) {
    return '< 1 minute'
  } else {
    return `${timeToRead} ${timeToRead > 1 ? 'minutes' : 'minute'}`
  }
}
