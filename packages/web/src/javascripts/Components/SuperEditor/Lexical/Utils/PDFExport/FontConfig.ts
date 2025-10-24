import { Font } from '@react-pdf/renderer'
import { LexicalNode } from 'lexical'
// @ts-expect-error No typing for this package
import { unicodeScripts } from 'unicode-script'

enum UnicodeScript {
  Latin = 'Latin',
  Common = 'Common',
  Cyrillic = 'Cyrillic',
  Greek = 'Greek',
  Hebrew = 'Hebrew',
  Arabic = 'Arabic',
  Devanagari = 'Devanagari',
  Bengali = 'Bengali',
  Tamil = 'Tamil',
  Telugu = 'Telugu',
  Gujarati = 'Gujarati',
  Gurmukhi = 'Gurmukhi',
  Malayalam = 'Malayalam',
  Sinhala = 'Sinhala',
  Thai = 'Thai',
  Armenian = 'Armenian',
  Georgian = 'Georgian',
  Ethiopic = 'Ethiopic',
  Myanmar = 'Myanmar',
  Khmer = 'Khmer',
  Lao = 'Lao',
  Tibetan = 'Tibetan',
  Vietnamese = 'Vietnamese',
  Chinese = 'Chinese',
  Han = 'Han',
  Japanese = 'Japanese',
  Korean = 'Korean',
  Hangul = 'Hangul',
}

export enum FontFamily {
  NotoSans = 'Noto Sans',
  NotoSansGreek = 'Noto Sans Greek',
  NotoSansHebrew = 'Noto Sans Hebrew',
  NotoSansArabic = 'Noto Sans Arabic',
  NotoSansDevanagari = 'Noto Sans Devanagari',
  NotoSansBengali = 'Noto Sans Bengali',
  NotoSansTamil = 'Noto Sans Tamil',
  NotoSansTelugu = 'Noto Sans Telugu',
  NotoSansGujarati = 'Noto Sans Gujarati',
  NotoSansGurmukhi = 'Noto Sans Gurmukhi',
  NotoSansMalayalam = 'Noto Sans Malayalam',
  NotoSansSinhala = 'Noto Sans Sinhala',
  NotoSansThai = 'Noto Sans Thai',
  NotoSansArmenian = 'Noto Sans Armenian',
  NotoSansGeorgian = 'Noto Sans Georgian',
  NotoSansEthiopic = 'Noto Sans Ethiopic',
  NotoSansMyanmar = 'Noto Sans Myanmar',
  NotoSansKhmer = 'Noto Sans Khmer',
  NotoSansLao = 'Noto Sans Lao',
  NotoSansTibetan = 'Noto Sans Tibetan',
  NotoSansVietnamese = 'Noto Sans Vietnamese',
  NotoSansSC = 'Noto Sans SC',
  NotoSansJP = 'Noto Sans JP',
  NotoSansKR = 'Noto Sans KR',
  Courier = 'Courier',
  Helvetica = 'Helvetica',
}

enum FontVariant {
  Normal = 'normal',
  Bold = 'bold',
  Italic = 'italic',
  BoldItalic = 'bolditalic',
}

type FontWeight = 'normal' | 'bold'
type FontStyle = 'normal' | 'italic'

const FONT_VARIANT_TO_FONT_OPTIONS: Record<FontVariant, { fontWeight: FontWeight; fontStyle: FontStyle }> = {
  [FontVariant.Normal]: {
    fontWeight: 'normal',
    fontStyle: 'normal',
  },
  [FontVariant.Bold]: {
    fontWeight: 'bold',
    fontStyle: 'normal',
  },
  [FontVariant.Italic]: {
    fontWeight: 'normal',
    fontStyle: 'italic',
  },
  [FontVariant.BoldItalic]: {
    fontWeight: 'bold',
    fontStyle: 'italic',
  },
}

const FONT_ASSETS_BASE_PATH = 'https://assets.standardnotes.com/fonts'
const FALLBACK_FONT_SOURCE = '/noto-sans/NotoSans-Regular.ttf'

export const FALLBACK_FONT_FAMILY = FontFamily.Helvetica
export const MONOSPACE_FONT_FAMILY = FontFamily.Courier

const FONT_FAMILY_TO_FONT_SOURCES: Partial<Record<FontFamily, Partial<Record<FontVariant, string>>>> = {
  [FontFamily.NotoSans]: {
    [FontVariant.Normal]: '/noto-sans/NotoSans-Regular.ttf',
    [FontVariant.Bold]: '/noto-sans/NotoSans-Bold.ttf',
    [FontVariant.Italic]: '/noto-sans/NotoSans-Italic.ttf',
    [FontVariant.BoldItalic]: '/noto-sans/NotoSans-BoldItalic.ttf',
  },
  [FontFamily.NotoSansGreek]: {
    [FontVariant.Normal]: '/noto-sans-greek/NotoSansGreek-Regular.ttf',
    [FontVariant.Bold]: '/noto-sans-greek/NotoSansGreek-Bold.ttf',
  },
  [FontFamily.NotoSansHebrew]: {
    [FontVariant.Normal]: '/noto-sans-hebrew/NotoSansHebrew-Regular.ttf',
    [FontVariant.Bold]: '/noto-sans-hebrew/NotoSansHebrew-Bold.ttf',
  },
  [FontFamily.NotoSansArabic]: {
    [FontVariant.Normal]: '/noto-sans-arabic/NotoSansArabic-Regular.ttf',
    [FontVariant.Bold]: '/noto-sans-arabic/NotoSansArabic-Bold.ttf',
  },
  [FontFamily.NotoSansDevanagari]: {
    [FontVariant.Normal]: '/noto-sans-devanagari/NotoSansDevanagari-Regular.ttf',
    [FontVariant.Bold]: '/noto-sans-devanagari/NotoSansDevanagari-Bold.ttf',
  },
  [FontFamily.NotoSansBengali]: {
    [FontVariant.Normal]: '/noto-sans-bengali/NotoSansBengali-Regular.ttf',
  },
  [FontFamily.NotoSansTamil]: {
    [FontVariant.Normal]: '/noto-sans-tamil/NotoSansTamil-Regular.ttf',
  },
  [FontFamily.NotoSansTelugu]: {
    [FontVariant.Normal]: '/noto-sans-telugu/NotoSansTelugu-Regular.ttf',
  },
  [FontFamily.NotoSansGujarati]: {
    [FontVariant.Normal]: '/noto-sans-gujarati/NotoSansGujarati-Regular.ttf',
  },
  [FontFamily.NotoSansGurmukhi]: {
    [FontVariant.Normal]: '/noto-sans-gurmukhi/NotoSansGurmukhi-Regular.ttf',
  },
  [FontFamily.NotoSansMalayalam]: {
    [FontVariant.Normal]: '/noto-sans-malayalam/NotoSansMalayalam-Regular.ttf',
  },
  [FontFamily.NotoSansSinhala]: {
    [FontVariant.Normal]: '/noto-sans-sinhala/NotoSansSinhala-Regular.ttf',
  },
  [FontFamily.NotoSansThai]: {
    [FontVariant.Normal]: '/noto-sans-thai/NotoSansThai-Regular.ttf',
  },
  [FontFamily.NotoSansArmenian]: {
    [FontVariant.Normal]: '/noto-sans-armenian/NotoSansArmenian-Regular.ttf',
  },
  [FontFamily.NotoSansGeorgian]: {
    [FontVariant.Normal]: '/noto-sans-georgian/NotoSansGeorgian-Regular.ttf',
  },
  [FontFamily.NotoSansEthiopic]: {
    [FontVariant.Normal]: '/noto-sans-ethiopic/NotoSansEthiopic-Regular.ttf',
  },
  [FontFamily.NotoSansMyanmar]: {
    [FontVariant.Normal]: '/noto-sans-myanmar/NotoSansMyanmar-Regular.ttf',
  },
  [FontFamily.NotoSansKhmer]: {
    [FontVariant.Normal]: '/noto-sans-khmer/NotoSansKhmer-Regular.ttf',
  },
  [FontFamily.NotoSansLao]: {
    [FontVariant.Normal]: '/noto-sans-lao/NotoSansLao-Regular.ttf',
  },
  [FontFamily.NotoSansTibetan]: {
    [FontVariant.Normal]: '/noto-sans-tibetan/NotoSansTibetan-Regular.ttf',
  },
  [FontFamily.NotoSansSC]: {
    [FontVariant.Normal]: '/noto-sans-sc/NotoSansSC-Regular.ttf',
  },
  [FontFamily.NotoSansJP]: {
    [FontVariant.Normal]: '/noto-sans-jp/NotoSansJP-Regular.ttf',
  },
  [FontFamily.NotoSansKR]: {
    [FontVariant.Normal]: '/noto-sans-kr/NotoSansKR-Regular.ttf',
  },
}

export const getFontFamilyForUnicodeScript = (script: UnicodeScript): FontFamily => {
  switch (script) {
    // Common, shared scripts
    case UnicodeScript.Common:
    case UnicodeScript.Latin:
    case UnicodeScript.Cyrillic:
    case UnicodeScript.Greek:
    case UnicodeScript.Vietnamese:
      return FontFamily.NotoSans

    case UnicodeScript.Hebrew:
      return FontFamily.NotoSansHebrew

    case UnicodeScript.Arabic:
      return FontFamily.NotoSansArabic

    case UnicodeScript.Devanagari:
      return FontFamily.NotoSansDevanagari

    case UnicodeScript.Bengali:
      return FontFamily.NotoSansBengali

    case UnicodeScript.Tamil:
      return FontFamily.NotoSansTamil

    case UnicodeScript.Telugu:
      return FontFamily.NotoSansTelugu

    case UnicodeScript.Gujarati:
      return FontFamily.NotoSansGujarati

    case UnicodeScript.Gurmukhi:
      return FontFamily.NotoSansGurmukhi

    case UnicodeScript.Malayalam:
      return FontFamily.NotoSansMalayalam

    case UnicodeScript.Sinhala:
      return FontFamily.NotoSansSinhala

    case UnicodeScript.Thai:
      return FontFamily.NotoSansThai

    case UnicodeScript.Armenian:
      return FontFamily.NotoSansArmenian

    case UnicodeScript.Georgian:
      return FontFamily.NotoSansGeorgian

    case UnicodeScript.Ethiopic:
      return FontFamily.NotoSansEthiopic

    case UnicodeScript.Myanmar:
      return FontFamily.NotoSansMyanmar

    case UnicodeScript.Khmer:
      return FontFamily.NotoSansKhmer

    case UnicodeScript.Lao:
      return FontFamily.NotoSansLao

    case UnicodeScript.Tibetan:
      return FontFamily.NotoSansTibetan

    case UnicodeScript.Chinese:
    case UnicodeScript.Han:
      return FontFamily.NotoSansSC

    case UnicodeScript.Japanese:
      return FontFamily.NotoSansJP

    case UnicodeScript.Korean:
    case UnicodeScript.Hangul:
      return FontFamily.NotoSansKR

    default:
      return FontFamily.NotoSans
  }
}

const getFontRegisterOptions = (fontFamily: FontFamily) => {
  const fallback = FONT_FAMILY_TO_FONT_SOURCES[fontFamily]?.[FontVariant.Normal] ?? FALLBACK_FONT_SOURCE

  return {
    family: fontFamily,
    fonts: Object.entries(FONT_VARIANT_TO_FONT_OPTIONS).map(([variant, fontOptions]) => ({
      ...fontOptions,
      src: `${FONT_ASSETS_BASE_PATH}${FONT_FAMILY_TO_FONT_SOURCES[fontFamily]?.[variant as FontVariant] ?? fallback}`,
    })),
  }
}

export const getFontFamiliesFromLexicalNode = (node: LexicalNode) => {
  const scripts: UnicodeScript[] = Array.from(unicodeScripts(node.getTextContent()))
  const fontFamilies = [FontFamily.NotoSans]
  scripts.forEach((script) => {
    const fontFamilyForScript = getFontFamilyForUnicodeScript(script)
    if (!fontFamilies.includes(fontFamilyForScript)) {
      fontFamilies.unshift(fontFamilyForScript)
    }
  })
  const fontFamiliesSet = new Set(fontFamilies)
  return Array.from(fontFamiliesSet)
}

export const registerPDFFonts = (fontFamilies: FontFamily[]) => {
  const fontFamiliesToRegister = new Set(fontFamilies)
  fontFamiliesToRegister.forEach((fontFamily) => {
    const registerOptions = getFontRegisterOptions(fontFamily)
    Font.register(registerOptions)
  })
}
