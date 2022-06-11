import './styles.scss';

import { forwardRef, useImperativeHandle, useRef } from 'react';
import { EditorRef, ReactEditor, useEditor } from '@milkdown/react';
import { editorViewCtx, parserCtx } from '@milkdown/core';
import { Slice } from '@milkdown/prose';

import { createEditor, CreateEditorParams } from './editor';
import { MenuConfig } from './plugins/advanced-menu/config';

export type MilkdownRef = {
  update: (markdown: string) => void;
};

type MilkdownProps = {
  onChange: CreateEditorParams['onChange'];
  value?: CreateEditorParams['value'];
  menuConfig: MenuConfig;
  editable: CreateEditorParams['editable'];
  spellcheck: CreateEditorParams['spellcheck'];
};

const Milkdown = (
  { onChange, value, menuConfig, editable, spellcheck }: MilkdownProps,
  ref: React.ForwardedRef<MilkdownRef>
) => {
  const editorRef = useRef<EditorRef>(null);

  useImperativeHandle(ref, () => ({
    update: (markdown: string) => {
      if (!editable || !editorRef.current) {
        return;
      }

      const editor = editorRef.current.get();
      if (!editor) {
        return;
      }

      editor.action((ctx) => {
        const view = ctx.get(editorViewCtx);
        const parser = ctx.get(parserCtx);
        const document = parser(markdown);
        if (!document) {
          return;
        }

        const state = view.state;
        view.dispatch(
          state.tr
            .replace(
              0,
              state.doc.content.size,
              new Slice(document.content, 0, 0)
            )
            .setMeta('addToHistory', false)
        );
      });
    },
  }));

  const editor = useEditor(
    (root) => {
      return createEditor({
        root,
        onChange,
        value,
        menuConfig,
        editable,
        spellcheck,
      });
    },
    [value, onChange, value, menuConfig, editable, spellcheck]
  );

  return (
    <div className="milkdown-container">
      <ReactEditor ref={editorRef} editor={editor} />
    </div>
  );
};

export default forwardRef<MilkdownRef, MilkdownProps>(Milkdown);
