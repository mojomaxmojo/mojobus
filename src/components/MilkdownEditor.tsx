import { useEffect, useRef, useState, useCallback } from 'react';
import { Editor, rootCtx, defaultValueCtx, editorViewCtx } from '@milkdown/core';
import { Milkdown, MilkdownProvider, useEditor } from '@milkdown/react';
import { commonmark, toggleStrongCommand, toggleEmphasisCommand, wrapInBlockquoteCommand, insertHrCommand, turnIntoTextCommand, wrapInHeadingCommand, toggleInlineCodeCommand, wrapInBulletListCommand, wrapInOrderedListCommand } from '@milkdown/preset-commonmark';
import { gfm, toggleStrikethroughCommand } from '@milkdown/preset-gfm';
import { history } from '@milkdown/plugin-history';
import { clipboard } from '@milkdown/plugin-clipboard';
import { listener, listenerCtx } from '@milkdown/plugin-listener';
import { upload, uploadConfig } from '@milkdown/plugin-upload';
import { Decoration } from '@milkdown/prose/view';
import { replaceAll, callCommand } from '@milkdown/utils';
import {
  Bold,
  Italic,
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
  Code,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useUploadFile } from '@/hooks/useUploadFile';

interface MilkdownEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  minHeight?: string;
  maxLength?: number;
  onImageUpload?: (url: string) => void;
}

function MilkdownEditorInner({
  content,
  onChange,
  placeholder = 'Schreibe deinen Artikel hier...',
  minHeight = '400px',
  maxLength,
  onImageUpload,
}: MilkdownEditorProps) {
  const { mutateAsync: uploadFile, isPending: isUploading } = useUploadFile();
  const initialValueRef = useRef(content);
  const lastExternalValue = useRef(content);
  const onImageUploadRef = useRef(onImageUpload);
  const editorRef = useRef<Editor | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Keep refs updated
  useEffect(() => {
    onImageUploadRef.current = onImageUpload;
  }, [onImageUpload]);

  const { get } = useEditor((root) => {
    const editor = Editor.make()
      .config((ctx) => {
        ctx.set(rootCtx, root);
        ctx.set(defaultValueCtx, initialValueRef.current);

        // ✅ Markdown direkt - keine Konvertierung!
        ctx.get(listenerCtx).markdownUpdated((_, markdown) => {
          lastExternalValue.current = markdown;
          onChange(markdown);
        });

        // Configure upload plugin
        ctx.set(uploadConfig.key, {
          uploader: async (files, schema) => {
            const images: File[] = [];

            for (let i = 0; i < files.length; i++) {
              const file = files.item(i);
              if (!file) continue;

              // Only handle images
              if (!file.type.includes('image')) continue;

              images.push(file);
            }

            const nodes: ReturnType<typeof schema.nodes.image.createAndFill>[] = [];

            for (const image of images) {
              try {
                setIsUploadingImage(true);
                // Use the upload handler
                const [[_, url]] = await uploadFile(image);

                const node = schema.nodes.image.createAndFill({
                  src: url,
                  alt: image.name,
                });
                if (node) nodes.push(node);

                if (onImageUploadRef.current) {
                  onImageUploadRef.current(url);
                }
              } catch (error) {
                console.error('Failed to upload image:', error);
              } finally {
                setIsUploadingImage(false);
              }
            }

            return nodes.filter((node): node is NonNullable<typeof node> => node !== null);
          },
          enableHtmlFileUploader: true,
          uploadWidgetFactory: (pos, spec) => {
            // Create a placeholder widget while uploading
            const widgetEl = document.createElement('div');
            widgetEl.className = 'milkdown-upload-placeholder flex items-center gap-2 p-2 bg-muted rounded';
            widgetEl.innerHTML = `
              <div class="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
              <span>Uploading...</span>
            `;
            return Decoration.widget(pos, widgetEl, spec);
          },
        });
      })
      .use(commonmark)
      .use(gfm)
      .use(history)
      .use(clipboard)
      .use(listener)
      .use(upload);

    return editor;
  });

  // Store editor reference
  useEffect(() => {
    editorRef.current = get() ?? null;
  }, [get]);

  // Handle external value changes (e.g., loading a draft)
  useEffect(() => {
    const editor = get();
    if (editor && content !== lastExternalValue.current) {
      // Only update if the value changed externally (not from user typing)
      editor.action(replaceAll(content));
      lastExternalValue.current = content;
    }
  }, [content, get]);

  // Handle toolbar commands
  const handleCommand = useCallback((command: string) => {
    const editor = get();
    if (!editor) return;

    try {
      const view = editor.ctx.get(editorViewCtx);

      switch (command) {
        case 'toggleBold':
          editor.action(callCommand(toggleStrongCommand.key));
          break;
        case 'toggleItalic':
          editor.action(callCommand(toggleEmphasisCommand.key));
          break;
        case 'toggleStrikethrough':
          editor.action(callCommand(toggleStrikethroughCommand.key));
          break;
        case 'toggleInlineCode':
          editor.action(callCommand(toggleInlineCodeCommand.key));
          break;
        case 'heading1':
          editor.action(callCommand(wrapInHeadingCommand.key, 1));
          break;
        case 'heading2':
          editor.action(callCommand(wrapInHeadingCommand.key, 2));
          break;
        case 'heading3':
          editor.action(callCommand(wrapInHeadingCommand.key, 3));
          break;
        case 'bulletList':
          editor.action(callCommand(wrapInBulletListCommand.key));
          break;
        case 'orderedList':
          editor.action(callCommand(wrapInOrderedListCommand.key));
          break;
        case 'blockquote':
          editor.action(callCommand(wrapInBlockquoteCommand.key));
          break;
        case 'hr':
          editor.action(callCommand(insertHrCommand.key));
          break;
        case 'paragraph':
          editor.action(callCommand(turnIntoTextCommand.key));
          break;
        case 'undo':
          editor.action(callCommand('Undo'));
          break;
        case 'redo':
          editor.action(callCommand('Redo'));
          break;
      }

      // Refocus the editor
      view.focus();
    } catch (error) {
      console.error('Command failed:', error);
    }
  }, [get]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    try {
      const [[_, url]] = await uploadFile(file);
      
      // Insert image markdown at cursor position
      const imageMarkdown = `![${file.name}](${url})`;
      const newContent = content + '\n' + imageMarkdown + '\n';
      onChange(newContent);

      if (onImageUpload) {
        onImageUpload(url);
      }
    } catch (error) {
      console.error('Image upload failed:', error);
    } finally {
      setIsUploadingImage(false);
    }

    // Reset input so the same file can be selected again
    e.target.value = '';
  };

  const addLink = () => {
    const url = window.prompt('Link URL eingeben:');
    if (url) {
      const text = window.prompt('Link Text eingeben:', url);
      if (text) {
        const linkMarkdown = `[${text}](${url})`;
        const newContent = content + linkMarkdown;
        onChange(newContent);
      }
    }
  };

  // Calculate character and word count
  const characterCount = content.length;
  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;

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
              onClick={() => handleCommand('undo')}
              title="Rückgängig"
            >
              <Undo className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCommand('redo')}
              title="Wiederherstellen"
            >
              <Redo className="h-4 w-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Headings */}
          <div className="flex items-center gap-1 px-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCommand('heading1')}
              title="Überschrift 1"
            >
              <Heading1 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCommand('heading2')}
              title="Überschrift 2"
            >
              <Heading2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCommand('heading3')}
              title="Überschrift 3"
            >
              <Heading3 className="h-4 w-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Text Formatting */}
          <div className="flex items-center gap-1 px-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCommand('toggleBold')}
              title="Fett (Ctrl+B)"
            >
              <Bold className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCommand('toggleItalic')}
              title="Kursiv (Ctrl+I)"
            >
              <Italic className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCommand('toggleStrikethrough')}
              title="Durchgestrichen"
            >
              <Strikethrough className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCommand('toggleInlineCode')}
              title="Inline Code"
            >
              <Code className="h-4 w-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Lists */}
          <div className="flex items-center gap-1 px-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCommand('bulletList')}
              title="Aufzählung"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCommand('orderedList')}
              title="Nummerierte Liste"
            >
              <ListOrdered className="h-4 w-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Links and Images */}
          <div className="flex items-center gap-1 px-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={addLink}
              title="Link einfügen"
            >
              <LinkIcon className="h-4 w-4" />
            </Button>

            <label className="cursor-pointer">
              <Button
                variant="ghost"
                size="sm"
                asChild
                disabled={isUploadingImage || isUploading}
                title="Bild hochladen"
              >
                <span>
                  {isUploadingImage || isUploading ? (
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
                onChange={handleImageUpload}
              />
            </label>
          </div>
        </div>
      </div>

      {/* Editor Content */}
      <div 
        className="milkdown-content min-h-[400px] max-h-[800px] overflow-y-auto bg-white dark:bg-gray-950"
        style={{ minHeight }}
      >
        <MilkdownProvider>
          <Milkdown />
        </MilkdownProvider>
      </div>

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

export function MilkdownEditor(props: MilkdownEditorProps) {
  return <MilkdownEditorInner {...props} />;
}
