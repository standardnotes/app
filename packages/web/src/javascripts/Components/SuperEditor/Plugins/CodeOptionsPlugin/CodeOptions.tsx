import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $findMatchingParent, mergeRegister } from '@lexical/utils'
import { $getNodeByKey, $getSelection, $isRangeSelection, $isRootOrShadowRoot, NodeKey } from 'lexical'
import { useCallback, useEffect, useState } from 'react'
import { $isCodeNode, CODE_LANGUAGE_MAP, CODE_LANGUAGE_FRIENDLY_NAME_MAP, normalizeCodeLang } from '@lexical/code'
import Dropdown from '@/Components/Dropdown/Dropdown'

function getCodeLanguageOptions(): [string, string][] {
  const options: [string, string][] = []

  for (const [lang, friendlyName] of Object.entries(CODE_LANGUAGE_FRIENDLY_NAME_MAP)) {
    options.push([lang, friendlyName])
  }

  return options
}

const CODE_LANGUAGE_OPTIONS = getCodeLanguageOptions()

const CodeOptionsPlugin = () => {
  const [editor] = useLexicalComposerContext()

  const [isCode, setIsCode] = useState(false)
  const [codeLanguage, setCodeLanguage] = useState<keyof typeof CODE_LANGUAGE_MAP>('')
  const [selectedElementKey, setSelectedElementKey] = useState<NodeKey | null>(null)

  const updateToolbar = useCallback(() => {
    if (!editor.isEditable()) {
      setIsCode(false)
      return
    }

    const selection = $getSelection()
    if (!$isRangeSelection(selection)) {
      return
    }

    const anchorNode = selection.anchor.getNode()
    let element =
      anchorNode.getKey() === 'root'
        ? anchorNode
        : $findMatchingParent(anchorNode, (e) => {
            const parent = e.getParent()
            return parent !== null && $isRootOrShadowRoot(parent)
          })

    if (element === null) {
      element = anchorNode.getTopLevelElementOrThrow()
    }

    const elementKey = element.getKey()
    const elementDOM = editor.getElementByKey(elementKey)

    if (elementDOM !== null) {
      setSelectedElementKey(elementKey)
      if ($isCodeNode(element)) {
        setIsCode(true)
        const language = element.getLanguage() as keyof typeof CODE_LANGUAGE_MAP
        setCodeLanguage(language ? CODE_LANGUAGE_MAP[language] || language : '')
      } else {
        setIsCode(false)
      }
    }
  }, [editor])

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          updateToolbar()
        })
      }),
    )
  }, [editor, updateToolbar])

  const onCodeLanguageSelect = useCallback(
    (value: string) => {
      editor.update(() => {
        if (selectedElementKey !== null) {
          const node = $getNodeByKey(selectedElementKey)
          if ($isCodeNode(node)) {
            node.setLanguage(value)
          }
        }
      })
    },
    [editor, selectedElementKey],
  )

  if (!isCode) {
    return null
  }

  return (
    <>
      <div className="absolute right-6 top-13 rounded border border-border bg-default p-2">
        <Dropdown
          label="Change code block language"
          items={CODE_LANGUAGE_OPTIONS.map(([value, label]) => ({
            label,
            value,
          }))}
          value={normalizeCodeLang(codeLanguage)}
          onChange={(value: string) => {
            onCodeLanguageSelect(value)
          }}
        />
      </div>
    </>
  )
}

export default CodeOptionsPlugin
