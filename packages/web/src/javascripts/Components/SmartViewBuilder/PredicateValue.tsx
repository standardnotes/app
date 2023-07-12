import { getDropdownItemsForAllEditors } from '@/Utils/DropdownItemsForEditors'
import { NoteType } from '@standardnotes/snjs'
import { useApplication } from '../ApplicationProvider'
import { PredicateKeypath, PredicateKeypathTypes } from './PredicateKeypaths'

type Props = {
  keypath: PredicateKeypath
  value: string
  setValue: (value: string) => void
}

const PredicateValue = ({ keypath, value, setValue }: Props) => {
  const application = useApplication()
  const type = PredicateKeypathTypes[keypath]
  const editorItems = getDropdownItemsForAllEditors(application)

  return type === 'noteType' ? (
    <select
      className="flex-grow rounded border border-border bg-default px-2 py-1.5 focus:outline focus:outline-1 focus:outline-info"
      value={value}
      onChange={(event) => {
        setValue(event.target.value)
      }}
    >
      {Object.entries(NoteType).map(([key, value]) => (
        <option key={key} value={value}>
          {key}
        </option>
      ))}
    </select>
  ) : type === 'editorIdentifier' ? (
    <select
      className="flex-grow rounded border border-border bg-default px-2 py-1.5 focus:outline focus:outline-1 focus:outline-info"
      value={value}
      onChange={(event) => {
        setValue(event.target.value)
      }}
    >
      {editorItems.map((editor) => (
        <option key={editor.value} value={editor.value}>
          {editor.label}
        </option>
      ))}
    </select>
  ) : type === 'string' || type === 'date' ? (
    <input
      className="flex-grow rounded border border-border bg-default px-2 py-1.5"
      value={value}
      onChange={(event) => {
        setValue(event.target.value)
      }}
    />
  ) : type === 'boolean' ? (
    <select
      className="flex-grow rounded border border-border bg-default px-2 py-1.5 focus:outline focus:outline-1 focus:outline-info"
      value={value}
      onChange={(event) => {
        setValue(event.target.value)
      }}
    >
      <option value="true">True</option>
      <option value="false">False</option>
    </select>
  ) : type === 'number' ? (
    <input
      type="number"
      className="flex-grow rounded border border-border bg-default px-2 py-1.5"
      value={value}
      onChange={(event) => {
        setValue(event.target.value)
      }}
    />
  ) : null
}

export default PredicateValue
