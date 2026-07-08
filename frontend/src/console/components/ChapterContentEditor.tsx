import { useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TiptapImage from "@tiptap/extension-image";
import TiptapLink from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import { uploadImage } from "../../api/client";
import { useTranslation } from "../../context/LanguageContext";
import {
  BoldIcon,
  ImageIcon,
  ItalicIcon,
  LinkIcon,
  ListIcon,
  OrderedListIcon,
  QuoteIcon,
  RedoIcon,
  UnderlineIcon,
  UndoIcon,
} from "../../components/icons";

interface Props {
  content: string;
  onSave: (html: string) => Promise<void>;
  onCancel: () => void;
}

export function ChapterContentEditor({ content, onSave, onCancel }: Props) {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TiptapLink.configure({ openOnClick: false }),
      TiptapImage,
      Placeholder.configure({ placeholder: t("chapterEditor.placeholder") }),
    ],
    content,
    editorProps: {
      attributes: {
        class: "chapter-content text-slate-700 dark:text-slate-200 focus:outline-none min-h-60 px-4 py-3",
      },
    },
  });

  if (!editor) return null;

  function toolbarButtonClass(active: boolean) {
    return `p-2 rounded-lg ${
      active
        ? "bg-blue-600 text-white"
        : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
    }`;
  }

  async function handleImageSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !editor) return;
    setUploading(true);
    try {
      const url = await uploadImage(file);
      editor.chain().focus().setImage({ src: url }).run();
    } catch {
      alert(t("chapterEditor.uploadFailed"));
    } finally {
      setUploading(false);
    }
  }

  function handleSetLink() {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt(t("chapterEditor.linkPrompt"), previousUrl ?? "");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }

  async function handleSave() {
    if (!editor) return;
    setSaving(true);
    try {
      await onSave(editor.getHTML());
    } finally {
      setSaving(false);
    }
  }

  const divider = <span className="w-px h-5 bg-slate-200 dark:bg-slate-600 mx-1" />;

  return (
    <div className="border border-slate-200 dark:border-slate-600 rounded-xl overflow-hidden bg-white dark:bg-slate-800">
      <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 dark:border-slate-700 p-2">
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={toolbarButtonClass(editor.isActive("bold"))}>
          <BoldIcon />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={toolbarButtonClass(editor.isActive("italic"))}>
          <ItalicIcon />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} className={toolbarButtonClass(editor.isActive("underline"))}>
          <UnderlineIcon />
        </button>
        {divider}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`${toolbarButtonClass(editor.isActive("heading", { level: 2 }))} text-xs font-semibold px-2.5`}
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`${toolbarButtonClass(editor.isActive("heading", { level: 3 }))} text-xs font-semibold px-2.5`}
        >
          H3
        </button>
        {divider}
        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={toolbarButtonClass(editor.isActive("bulletList"))}>
          <ListIcon />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={toolbarButtonClass(editor.isActive("orderedList"))}>
          <OrderedListIcon />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={toolbarButtonClass(editor.isActive("blockquote"))}>
          <QuoteIcon />
        </button>
        {divider}
        <button type="button" onClick={handleSetLink} className={toolbarButtonClass(editor.isActive("link"))}>
          <LinkIcon />
        </button>
        <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} className={toolbarButtonClass(false)}>
          <ImageIcon />
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelected} className="hidden" />
        {divider}
        <button type="button" onClick={() => editor.chain().focus().undo().run()} className={toolbarButtonClass(false)}>
          <UndoIcon />
        </button>
        <button type="button" onClick={() => editor.chain().focus().redo().run()} className={toolbarButtonClass(false)}>
          <RedoIcon />
        </button>
        {uploading && <span className="text-xs text-slate-400 dark:text-slate-500 ml-2">{t("chapterEditor.uploading")}</span>}
      </div>
      <EditorContent editor={editor} />
      <div className="flex items-center gap-3 border-t border-slate-200 dark:border-slate-700 p-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium"
        >
          {saving ? t("chapterEditor.saving") : t("chapterEditor.save")}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm font-medium"
        >
          {t("chapterEditor.cancel")}
        </button>
      </div>
    </div>
  );
}
