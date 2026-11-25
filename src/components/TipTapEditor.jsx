import { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';

const CustomImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (element) => element.getAttribute('width'),
        renderHTML: (attributes) => {
          if (!attributes.width) return {};
          return { width: attributes.width };
        },
      },
      style: {
        default: null,
        parseHTML: (element) => element.getAttribute('style'),
        renderHTML: (attributes) => {
          if (!attributes.style) return {};
          return { style: attributes.style };
        },
      },
    };
  },
});

export default function TipTapEditor({
  value,
  onChange,
  placeholder = 'Skriv innehållet här...',
  minHeight = '355px',
  editorRef,
}) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      CustomImage.configure({
        allowBase64: false,
      }),
    ],
    content: value || '',
    onUpdate: ({ editor: currentEditor }) => {
      onChange(currentEditor.getHTML());
    },
    editorProps: {
      attributes: {
        'data-placeholder': placeholder,
        style: [
          'width: 100%',
          'max-width: 100%',
          `min-height: ${minHeight}`,
          'padding: 14px',
          'outline: none',
          'line-height: 1.6',
          'overflow-wrap: anywhere',
          'word-break: break-word',
          'box-sizing: border-box',
        ].join('; '),
      },
    },
  });

  // Exponera editor-instansen om föräldern vill infoga bild eller HTML
  useEffect(() => {
    if (editorRef) {
      editorRef.current = editor;
    }
  }, [editor, editorRef]);

  // Synka utifrån (t.ex. när en gammal version väljs i historiken eller sidan byts)
  useEffect(() => {
    if (!editor) return;
    const nextHtml = value || '';
    if (editor.getHTML() !== nextHtml) {
      editor.commands.setContent(nextHtml, { emitUpdate: false });
    }
  }, [value, editor]);

  if (!editor) {
    return null;
  }

  function handleSetLink() {
    const previousUrl = editor.getAttributes('link')?.href || '';
    const url = window.prompt('Ange länk-URL:', previousUrl);
    if (url === null) return;
    if (url.trim() === '') {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().setLink({ href: url.trim() }).run();
  }

  return (
    <div
      className="tiptap-wrapper"
      style={{
        width: '100%',
        maxWidth: '100%',
        border: '1px solid #cbd5e1',
        borderRadius: '8px',
        background: '#ffffff',
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      <div
        className="tiptap-toolbar"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '6px',
          padding: '8px 10px',
          borderBottom: '1px solid #e2e8f0',
          background: '#f8fafc',
        }}
      >
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          H2
        </button>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          H3
        </button>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <em>I</em>
        </button>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          - Lista
        </button>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          1. Lista
        
        </button>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={handleSetLink}
        >
          Länk
        </button>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => editor.chain().focus().undo().run()}
        >
          Ångra
        </button>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => editor.chain().focus().redo().run()}
        >
          Gör om
        </button>
      </div>

      <div
        style={{
          maxHeight: '420px',
          overflowY: 'auto',
          overflowX: 'hidden',
          width: '100%',
        }}
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}