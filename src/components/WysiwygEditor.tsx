import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import CharacterCount from '@tiptap/extension-character-count';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Link as LinkIcon,
  Image as ImageIcon,
  Undo,
  Redo,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useUploadFile } from '@/hooks/useUploadFile';
import { useState } from 'react';

interface WysiwygEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  minHeight?: string;
  maxLength?: number;
  onImageUpload?: (url: string) => void;
}

/**
 * WYSIWYG Editor basierend auf Tiptap
 * Unterstützt nur Markdown-kompatible Funktionen
 */
export function WysiwygEditor({
  content,
  onChange,
  placeholder = 'Schreibe deinen Artikel hier...',
  minHeight = '400px',
  maxLength,
  onImageUpload,
}: WysiwygEditorProps) {
  const { mutateAsync: uploadFile, isPending: isUploading } = useUploadFile();
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
        blockquote: false, // Blockquote ist nicht Markdown-kompatibel
        code: false, // Code-Block ist nicht Markdown-kompatibel
      }),
      Image.configure({
        inline: true,
        allowBase64: false,
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 hover:text-blue-700 underline',
        },
      }),
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === 'heading') {
            return 'Überschrift';
          }
          return placeholder;
        },
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Underline,
      CharacterCount.configure({
        limit: maxLength,
      }),
    ],
    content: content,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg dark:prose-invert max-w-none focus:outline-none min-h-[400px] p-4',
      },
    },
  });

  const handleImageUpload = async (file: File) => {
    if (!editor) return;

    setIsUploadingImage(true);
    try {
      const [[_, url]] = await uploadFile(file);

      editor.chain().focus().setImage({ src: url }).run();

      if (onImageUpload) {
        onImageUpload(url);
      }
    } catch (error) {
      console.error('Image upload failed:', error);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const addLink = () => {
    if (!editor) return;

    if (editor.isActive('link')) {
      editor.chain().focus().unsetLink().run();
    } else {
      const url = window.prompt('Link URL eingeben:');
      if (url) {
        editor.chain().focus().setLink({ href: url }).run();
      }
    }
  };

  if (!editor) {
    return (
      <div className="border rounded-lg p-4 min-h-[400px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  const characterCount = editor.storage.characterCount.characters();
  const wordCount = editor.storage.characterCount.words();

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="border-b bg-gray-50 dark:bg-gray-900 p-2 sticky top-0 z-10">
        <div className="flex flex-wrap items-center gap-1">
          {/* History */}
          <div className="flex items-center gap-1 pr-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              title="Rückgängig"
            >
              <Undo className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              title="Wiederherstellen"
            >
              <Redo className="h-4 w-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Headings */}
          <div className="flex items-center gap-1 px-2">
            <Button
              variant={editor.isActive('heading', { level: 1 }) ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              title="Überschrift 1"
            >
              <Heading1 className="h-4 w-4" />
            </Button>
            <Button
              variant={editor.isActive('heading', { level: 2 }) ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              title="Überschrift 2"
            >
              <Heading2 className="h-4 w-4" />
            </Button>
            <Button
              variant={editor.isActive('heading', { level: 3 }) ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              title="Überschrift 3"
            >
              <Heading3 className="h-4 w-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Text Formatting */}
          <div className="flex items-center gap-1 px-2">
            <Button
              variant={editor.isActive('bold') ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => editor.chain().focus().toggleBold().run()}
              title="Fett (Ctrl+B)"
            >
              <Bold className="h-4 w-4" />
            </Button>
            <Button
              variant={editor.isActive('italic') ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              title="Kursiv (Ctrl+I)"
            >
              <Italic className="h-4 w-4" />
            </Button>
            <Button
              variant={editor.isActive('underline') ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              title="Unterstrichen (Ctrl+U)"
            >
              <Underline className="h-4 w-4" />
            </Button>
            <Button
              variant={editor.isActive('strike') ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => editor.chain().focus().toggleStrike().run()}
              title="Durchgestrichen"
            >
              <Strikethrough className="h-4 w-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Lists */}
          <div className="flex items-center gap-1 px-2">
            <Button
              variant={editor.isActive('bulletList') ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              title="Aufzählung"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={editor.isActive('orderedList') ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              title="Nummerierte Liste"
            >
              <ListOrdered className="h-4 w-4" />
            </Button>
            <Button
              variant={editor.isActive('taskList') ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => editor.chain().focus().toggleTaskList().run()}
              title="Checkliste"
            >
              <CheckSquare className="h-4 w-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Links and Images */}
          <div className="flex items-center gap-1 px-2">
            <Button
              variant={editor.isActive('link') ? 'secondary' : 'ghost'}
              size="sm"
              onClick={addLink}
              title={editor.isActive('link') ? 'Link entfernen' : 'Link einfügen'}
            >
              <LinkIcon className="h-4 w-4" />
            </Button>

            <label className="cursor-pointer">
              <Button
                variant={editor.isActive('image') ? 'secondary' : 'ghost'}
                size="sm"
                asChild
                disabled={isUploadingImage}
                title="Bild hochladen"
              >
                <span>
                  {isUploadingImage ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                  ) : (
                    <ImageIcon className="h-4 w-4" />
                  )}
                </span>
              </Button>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file);
                  e.target.value = '';
                }}
              />
            </label>
          </div>
        </div>
      </div>

      {/* Editor Content */}
      <EditorContent
        editor={editor}
        className="min-h-[400px] max-h-[800px] overflow-y-auto p-4 bg-white dark:bg-gray-950"
        style={{ minHeight }}
      />

      {/* Footer with character count */}
      <div className="border-t bg-gray-50 dark:bg-gray-900 px-4 py-2 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
        <div className="flex items-center gap-4">
          <span>{characterCount} Zeichen</span>
          <span>{wordCount} Wörter</span>
        </div>
        {maxLength && (
          <div className={`text-sm ${characterCount > maxLength ? 'text-red-600' : ''}`}>
            {characterCount} / {maxLength}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Hilfsfunktion: HTML zu Markdown konvertieren
 * Für den Export des Inhalts als Markdown
 */
export function htmlToMarkdown(html: string): string {
  let markdown = html;

  // Überschriften
  markdown = markdown.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n');
  markdown = markdown.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n');
  markdown = markdown.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n');

  // Fett und Kursiv
  markdown = markdown.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
  markdown = markdown.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**');
  markdown = markdown.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*');
  markdown = markdown.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*');

  // Unterstrichen
  markdown = markdown.replace(/<u[^>]*>(.*?)<\/u>/gi, '__$1__');

  // Durchgestrichen
  markdown = markdown.replace(/<s[^>]*>(.*?)<\/s>/gi, '~~$1~~');
  markdown = markdown.replace(/<strike[^>]*>(.*?)<\/strike>/gi, '~~$1~~');

  // Links
  markdown = markdown.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)');

  // Bilder
  markdown = markdown.replace(/<img[^>]*src="([^"]*)"[^>]*>/gi, '![]($1)');

  // Zitate
  markdown = markdown.replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gis, '> $1\n\n');

  // Listen
  markdown = markdown.replace(/<ul[^>]*>/gi, '');
  markdown = markdown.replace(/<\/ul>/gi, '\n');
  markdown = markdown.replace(/<ol[^>]*>/gi, '');
  markdown = markdown.replace(/<\/ol>/gi, '\n');
  markdown = markdown.replace(/<li[^>]*>(.*?)<\/li>/gis, '* $1\n');

  // Task Lists
  markdown = markdown.replace(/<ul[^>]*data-type="taskList"[^>]*>/gi, '');
  markdown = markdown.replace(/<\/ul>/gi, '\n');
  markdown = markdown.replace(/<li[^>]*data-type="taskItem"[^>]*>(.*?)<\/li>/gis, (match, content) => {
    // Prüfen, ob checked vorhanden ist
    const isChecked = /<input[^>]*checked[^>]*>/.test(content);
    const textContent = content.replace(/<input[^>]*>/, '').trim();
    return isChecked ? `- [x] ${textContent}\n` : `- [ ] ${textContent}\n`;
  });

  // Zeilenumbrüche
  markdown = markdown.replace(/<br[^>]*>/gi, '\n');
  markdown = markdown.replace(/<\/p[^>]*>/gi, '\n\n');
  markdown = markdown.replace(/<p[^>]*>/gi, '');

  // Entferne verbleibende HTML-Tags
  markdown = markdown.replace(/<[^>]*>/g, '');

  // Aufräumen
  markdown = markdown.replace(/\n{3,}/g, '\n\n');

  return markdown.trim();
}

/**
 * Hilfsfunktion: Markdown zu HTML konvertieren
 * Für den Import von Markdown in den Editor
 */
export function markdownToHtml(markdown: string): string {
  let html = markdown;

  // Überschriften
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

  // Fett und Kursiv
  html = html.replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>');
  html = html.replace(/\*(.*)\*/gim, '<em>$1</em>');
  html = html.replace(/__(.*)__/gim, '<u>$1</u>');
  html = html.replace(/~~(.*)~~/gim, '<s>$1</s>');

  // Links
  html = html.replace(/\[(.*)\]\((.*)\)/gim, '<a href="$2">$1</a>');

  // Bilder
  html = html.replace(/!\[(.*)\]\((.*)\)/gim, '<img src="$2" alt="$1" />');

  // Zitate
  html = html.replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>');

  // Listen
  html = html.replace(/^\* (.*$)/gim, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>\n?)+/gim, '<ul>$&</ul>');

  // Task Lists
  html = html.replace(/^- \[ \] (.*$)/gim, '<li data-type="taskItem"><input type="checkbox">$1</li>');
  html = html.replace(/^- \[x\] (.*$)/gim, '<li data-type="taskItem"><input type="checkbox" checked>$1</li>');
  html = html.replace(/(<li data-type="taskItem">.*<\/li>\n?)+/gim, '<ul data-type="taskList">$&</ul>');

  // Zeilenumbrüche
  html = html.replace(/\n\n/gim, '</p><p>');
  html = html.replace(/\n/gim, '<br />');

  return `<p>${html}</p>`;
}
