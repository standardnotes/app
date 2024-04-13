/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { INSERT_TABLE_COMMAND, TableNode, TableRowNode } from '@lexical/table'
import { $createParagraphNode, LexicalEditor } from 'lexical'
import { useCallback, useEffect, useState } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { mergeRegister } from '@lexical/utils'
import DecoratedInput from '@/Components/Input/DecoratedInput'
import Button from '@/Components/Button/Button'
import { isMobileScreen } from '../../../Utils'

export function InsertTableDialog({
  activeEditor,
  onClose,
}: {
  activeEditor: LexicalEditor
  onClose: () => void
}): JSX.Element {
  const [rows, setRows] = useState('5')
  const [columns, setColumns] = useState('5')

  const onClick = () => {
    activeEditor.dispatchCommand(INSERT_TABLE_COMMAND, { columns, rows })
    onClose()
  }

  const focusOnMount = useCallback((element: HTMLInputElement | null) => {
    if (element) {
      setTimeout(() => element.focus())
    }
  }, [])

  return (
    <>
      <label className="mb-2.5 flex items-center justify-between gap-3">
        Rows:
        <DecoratedInput type="number" value={rows} onChange={setRows} ref={focusOnMount} />
      </label>
      <label className="mb-2.5 flex items-center justify-between gap-3">
        Columns:
        <DecoratedInput type="number" value={columns} onChange={setColumns} />
      </label>
      <div className="flex justify-end">
        <Button onClick={onClick} small={isMobileScreen()}>
          Confirm
        </Button>
      </div>
    </>
  )
}

/**
 * Sometimes copy/pasting tables from other sources can result
 * in adding extra table nodes which don't have any children.
 * This causes an error when copying the table or exporting the
 * note as HTML.
 * This plugin removes any tables which don't have any children.
 */
export function RemoveBrokenTablesPlugin() {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    return mergeRegister(
      editor.registerNodeTransform(TableRowNode, (node) => {
        if (!node.getFirstChild()) {
          node.remove()
        }
      }),
      editor.registerNodeTransform(TableNode, (node) => {
        if (!node.getFirstChild()) {
          node.remove()
        }
        const hasNextSibling = !!node.getNextSibling()
        const hasPreviousSibling = !!node.getPreviousSibling()
        if (!node.getParent()) {
          return
        }
        if (!hasNextSibling) {
          node.insertAfter($createParagraphNode())
        } else if (!hasPreviousSibling) {
          node.insertBefore($createParagraphNode())
        }
      }),
    )
  }, [editor])

  return null
}
