/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { URL_REGEX, EMAIL_REGEX } from '@/Constants/Constants'
import { AutoLinkPlugin, createLinkMatcherWithRegExp } from '@lexical/react/LexicalAutoLinkPlugin'

const MATCHERS = [
  createLinkMatcherWithRegExp(URL_REGEX, (text) => {
    return text.startsWith('http') ? text : `https://${text}`
  }),
  createLinkMatcherWithRegExp(EMAIL_REGEX, (text) => {
    return `mailto:${text}`
  }),
]

export default function LexicalAutoLinkPlugin(): JSX.Element {
  return <AutoLinkPlugin matchers={MATCHERS} />
}
