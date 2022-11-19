const LOWER_CASE_LETTERS = 'abcdefghijklmnopqrstuvwxyz'.split('')
const UPPER_CASE_LETTERS = LOWER_CASE_LETTERS.map((l) => l.toUpperCase())
const SPECIAL_SYMBOLS = '!£$%^&*()@~:;,./?{}=-_'.split('')
const CHARACTER_SET = [...LOWER_CASE_LETTERS, ...UPPER_CASE_LETTERS, ...SPECIAL_SYMBOLS]
const CHARACTER_SET_LENGTH = CHARACTER_SET.length

function isValidPassword(password: string) {
  const containsSymbols = SPECIAL_SYMBOLS.some((symbol) => password.includes(symbol))
  const containsUpperCase = UPPER_CASE_LETTERS.some((upperLetter) => password.includes(upperLetter))
  const containsLowerCase = LOWER_CASE_LETTERS.some((lowerLetter) => password.includes(lowerLetter))

  return containsLowerCase && containsUpperCase && containsSymbols
}

export function generatePassword(length: number): string {
  const buffer = new Uint8Array(length)

  let generatedPassword = ''

  do {
    window.crypto.getRandomValues(buffer)
    generatedPassword = [...buffer].map((x) => CHARACTER_SET[x % CHARACTER_SET_LENGTH]).join('')
  } while (!isValidPassword(generatedPassword))

  return generatedPassword
}
