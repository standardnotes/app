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
  NotoSansCyrillic = 'Noto Sans Cyrillic',
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

const FALLBACK_FONT_SOURCE =
  'https://fonts.gstatic.com/s/notosans/v42/o-0mIpQlx3QUlC5A4PNB6Ryti20_6n1iPHjcz6L1SoM-jCpoiyD9A99d.ttf'
export const FALLBACK_FONT_FAMILY = FontFamily.Helvetica
export const MONOSPACE_FONT_FAMILY = FontFamily.Courier

const FONT_FAMILY_TO_FONT_SOURCES: Partial<Record<FontFamily, Partial<Record<FontVariant, string>>>> = {
  [FontFamily.NotoSans]: {
    [FontVariant.Normal]: FALLBACK_FONT_SOURCE,
    [FontVariant.Bold]:
      'https://fonts.gstatic.com/s/notosans/v42/o-0mIpQlx3QUlC5A4PNB6Ryti20_6n1iPHjcz6L1SoM-jCpoiyAaBN9d.ttf',
    [FontVariant.Italic]:
      'https://fonts.gstatic.com/s/notosans/v42/o-0kIpQlx3QUlC5A4PNr4C5OaxRsfNNlKbCePevHtVtX57DGjDU1QDce6Vc.ttf',
    [FontVariant.BoldItalic]:
      'https://fonts.gstatic.com/s/notosans/v42/o-0kIpQlx3QUlC5A4PNr4C5OaxRsfNNlKbCePevHtVtX57DGjDU1QNAZ6Vc.ttf',
  },
  [FontFamily.NotoSansCyrillic]: {
    [FontVariant.Normal]:
      'https://fonts.gstatic.com/s/notosans/v42/o-0mIpQlx3QUlC5A4PNB6Ryti20_6n1iPHjcz6L1SoM-jCpoiyD9A99d.ttf',
    [FontVariant.Bold]:
      'https://fonts.gstatic.com/s/notosans/v42/o-0mIpQlx3QUlC5A4PNB6Ryti20_6n1iPHjcz6L1SoM-jCpoiyAaBN9d.ttf',
  },
  [FontFamily.NotoSansGreek]: {
    [FontVariant.Normal]:
      'https://fonts.gstatic.com/s/notosans/v42/o-0mIpQlx3QUlC5A4PNB6Ryti20_6n1iPHjcz6L1SoM-jCpoiyD9A99d.ttf',
    [FontVariant.Bold]:
      'https://fonts.gstatic.com/s/notosans/v42/o-0mIpQlx3QUlC5A4PNB6Ryti20_6n1iPHjcz6L1SoM-jCpoiyAaBN9d.ttf',
  },
  [FontFamily.NotoSansHebrew]: {
    [FontVariant.Normal]:
      'https://fonts.gstatic.com/s/notosanshebrew/v50/or3HQ7v33eiDljA1IufXTtVf7V6RvEEdhQlk0LlGxCyaeNKYZC0sqk3xXGiXd4qtog.ttf',
    [FontVariant.Bold]:
      'https://fonts.gstatic.com/s/notosanshebrew/v50/or3HQ7v33eiDljA1IufXTtVf7V6RvEEdhQlk0LlGxCyaeNKYZC0sqk3xXGiXd4qtog.ttf',
  },
  [FontFamily.NotoSansArabic]: {
    [FontVariant.Normal]:
      'https://fonts.gstatic.com/s/notosansarabic/v33/nwpxtLGrOAZMl5nJ_wfgRg3DrWFZWsnVBJ_sS6tlqHHFlhQ5l3sQWIHPqzCfyGyvuw.ttf',
    [FontVariant.Bold]:
      'https://fonts.gstatic.com/s/notosansarabic/v33/nwpxtLGrOAZMl5nJ_wfgRg3DrWFZWsnVBJ_sS6tlqHHFlhQ5l3sQWIHPqzCfL2uvuw.ttf',
  },
  [FontFamily.NotoSansDevanagari]: {
    [FontVariant.Normal]:
      'https://fonts.gstatic.com/s/notosansdevanagari/v30/TuGoUUFzXI5FBtUq5a8bjKYTZjtRU6Sgv3NaV_SNmI0b8QQCQmHn6B2OHjbL_08AlXQly-A.ttf',
    [FontVariant.Bold]:
      'https://fonts.gstatic.com/s/notosansdevanagari/v30/TuGoUUFzXI5FBtUq5a8bjKYTZjtRU6Sgv3NaV_SNmI0b8QQCQmHn6B2OHjbL_08AlZMiy-A.ttf',
  },
  [FontFamily.NotoSansBengali]: {
    [FontVariant.Normal]:
      'https://fonts.gstatic.com/s/notosansbengali/v32/Cn-SJsCGWQxOjaGwMQ6fIiMywrNJIky6nvd8BjzVMvJx2mcSPVFpVEqE-6KmsolLudA.ttf',
  },
  [FontFamily.NotoSansTamil]: {
    [FontVariant.Normal]:
      'https://fonts.gstatic.com/s/notosanstamil/v31/ieVc2YdFI3GCY6SyQy1KfStzYKZgzN1z4LKDbeZce-0429tBManUktuex7vGo70R.ttf',
  },
  [FontFamily.NotoSansTelugu]: {
    [FontVariant.Normal]:
      'https://fonts.gstatic.com/s/notosanstelugu/v30/0FlxVOGZlE2Rrtr-HmgkMWJNjJ5_RyT8o8c7fHkeg-esVC5dzHkHIJQqrEntezbqQQ.ttf',
  },
  [FontFamily.NotoSansGujarati]: {
    [FontVariant.Normal]:
      'https://fonts.gstatic.com/s/notosansgujarati/v27/wlpWgx_HC1ti5ViekvcxnhMlCVo3f5pv17ivlzsUB14gg1TMR2Gw4VceEl7MA_ypFwPM.ttf',
  },
  [FontFamily.NotoSansGurmukhi]: {
    [FontVariant.Normal]:
      'https://fonts.gstatic.com/s/notosansgurmukhi/v29/w8g9H3EvQP81sInb43inmyN9zZ7hb7ATbSWo4q8dJ74a3cVrYFQ_bogT0-gPeG1Oenbx.ttf',
  },
  [FontFamily.NotoSansMalayalam]: {
    [FontVariant.Normal]:
      'https://fonts.gstatic.com/s/notosansmalayalam/v29/sJoi3K5XjsSdcnzn071rL37lpAOsUThnDZIfPdbeSNzVakglNM-Qw8EaeB8Nss-_RuD9BA.ttf',
  },
  [FontFamily.NotoSansSinhala]: {
    [FontVariant.Normal]:
      'https://fonts.gstatic.com/s/notosanssinhala/v36/yMJ2MJBya43H0SUF_WmcBEEf4rQVO2P524V5N_MxQzQtb-tf5dJbC30Fu9zUwg2a5lg.ttf',
  },
  [FontFamily.NotoSansThai]: {
    [FontVariant.Normal]:
      'https://fonts.gstatic.com/s/notosansthai/v29/iJWnBXeUZi_OHPqn4wq6hQ2_hbJ1xyN9wd43SofNWcd1MKVQt_So_9CdU5RtpzE.ttf',
  },
  [FontFamily.NotoSansArmenian]: {
    [FontVariant.Normal]:
      'https://fonts.gstatic.com/s/notosansarmenian/v47/ZgN0jOZKPa7CHqq0h37c7ReDUubm2SEdFXp7ig73qtTY5idb74R9UdM3y2nZLorxb60i.ttf',
  },
  [FontFamily.NotoSansGeorgian]: {
    [FontVariant.Normal]:
      'https://fonts.gstatic.com/s/notosansgeorgian/v48/PlIaFke5O6RzLfvNNVSitxkr76PRHBC4Ytyq-Gof7PUs4S7zWn-8YDB09HFNdpvnzFj-.ttf',
  },
  [FontFamily.NotoSansEthiopic]: {
    [FontVariant.Normal]:
      'https://fonts.gstatic.com/s/notosansethiopic/v50/7cHPv50vjIepfJVOZZgcpQ5B9FBTH9KGNfhSTgtoow1KVnIvyBoMSzUMacb-T35OK6Dj.ttf',
  },
  [FontFamily.NotoSansMyanmar]: {
    [FontVariant.Normal]: 'https://fonts.gstatic.com/s/notosansmyanmar/v21/AlZq_y1ZtY3ymOryg38hOCSdOnFq0En2.ttf',
  },
  [FontFamily.NotoSansKhmer]: {
    [FontVariant.Normal]:
      'https://fonts.gstatic.com/s/notosanskhmer/v29/ijw3s5roRME5LLRxjsRb-gssOenAyendxrgV2c-Zw-9vbVUti_Z_dWgtWYuNAJz4.ttf',
  },
  [FontFamily.NotoSansLao]: {
    [FontVariant.Normal]:
      'https://fonts.gstatic.com/s/notosanslao/v33/bx6lNx2Ol_ixgdYWLm9BwxM3NW6BOkuf763Clj73CiQ_J1Djx9pidOt4ccbdfw.ttf',
  },
  [FontFamily.NotoSansTibetan]: {
    [FontVariant.Normal]:
      'https://fonts.gstatic.com/s/notosans/v42/o-0mIpQlx3QUlC5A4PNB6Ryti20_6n1iPHjcz6L1SoM-jCpoiyD9A99d.ttf',
  },
  [FontFamily.NotoSansVietnamese]: {
    [FontVariant.Normal]:
      'https://fonts.gstatic.com/s/notosans/v42/o-0mIpQlx3QUlC5A4PNB6Ryti20_6n1iPHjcz6L1SoM-jCpoiyD9A99d.ttf',
  },
  [FontFamily.NotoSansSC]: {
    [FontVariant.Normal]: 'https://fonts.gstatic.com/s/notosanssc/v39/k3kCo84MPvpLmixcA63oeAL7Iqp5IZJF9bmaG9_FnYw.ttf',
  },
  [FontFamily.NotoSansJP]: {
    [FontVariant.Normal]: 'https://fonts.gstatic.com/s/notosansjp/v55/-F6jfjtqLzI2JPCgQBnw7HFyzSD-AsregP8VFBEj75s.ttf',
  },
  [FontFamily.NotoSansKR]: {
    [FontVariant.Normal]: 'https://fonts.gstatic.com/s/notosanskr/v38/PbyxFmXiEBPT4ITbgNA5Cgms3VYcOA-vvnIzzuoyeLQ.ttf',
  },
}

export const getFontFamilyForUnicodeScript = (script: UnicodeScript): FontFamily => {
  switch (script) {
    // Common, shared scripts
    case UnicodeScript.Common:
    case UnicodeScript.Latin:
      return FontFamily.NotoSans

    // Scripts with dedicated fonts
    case UnicodeScript.Cyrillic:
      return FontFamily.NotoSansCyrillic

    case UnicodeScript.Greek:
      return FontFamily.NotoSansGreek

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

    case UnicodeScript.Vietnamese:
      return FontFamily.NotoSansVietnamese

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
      src: FONT_FAMILY_TO_FONT_SOURCES[fontFamily]?.[variant as FontVariant] ?? fallback,
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
