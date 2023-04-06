/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { INSERT_TABLE_COMMAND } from '@lexical/table'
import { LexicalEditor } from 'lexical'
import { useState } from 'react'
import Button from '../Lexical/UI/Button'
import { DialogActions } from '../Lexical/UI/Dialog'
import TextInput from '../Lexical/UI/TextInput'

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
