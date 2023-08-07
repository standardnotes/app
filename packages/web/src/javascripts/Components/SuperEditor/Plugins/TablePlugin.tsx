/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { INSERT_TABLE_COMMAND, TableNode, TableRowNode } from '@lexical/table'
import { LexicalEditor } from 'lexical'
import { useEffect, useState } from 'react'
import Button from '../Lexical/UI/Button'
import { DialogActions } from '../Lexical/UI/Dialog'
import TextInput from '../Lexical/UI/TextInput'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { mergeRegister } from '@lexical/utils'

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

  return (
    <>
      <TextInput label="Number of rows" onChange={setRows} value={rows} />
      <TextInput label="Number of columns" onChange={setColumns} value={columns} />
      <DialogActions data-test-id="table-model-confirm-insert">
        <Button onClick={onClick}>Confirm</Button>
      </DialogActions>
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
      }),
    )
  }, [editor])

  return null
}
