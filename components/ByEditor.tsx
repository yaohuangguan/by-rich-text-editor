import React, { useRef, useState, useEffect } from 'react';
import { compressImage } from '../services/media';

interface ByEditorProps {
  initialContent?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
}

// --- Constants ---
const FONT_FAMILIES = [
  { name: 'Default', value: 'ui-sans-serif, system-ui, sans-serif' },
  { name: 'Serif', value: 'ui-serif, Georgia, serif' },
  { name: 'Mono', value: 'ui-monospace, SFMono-Regular, monospace' },
  { name: 'Comic', value: '"Comic Sans MS", cursive' }
];

const FONT_SIZES = [
  { name: 'Small', value: '2' }, // execCommand uses 1-7
  { name: 'Normal', value: '3' },
  { name: 'Large', value: '5' },
  { name: 'Huge', value: '7' }
];

const EMOJIS = [
  '😀', '😂', '😍', '🤔', '😎', '😭', '😡', '👍', 
  '👎', '🎉', '❤️', '🔥', '✅', '❌', '⭐'
];

export const ByEditor: React.FC<ByEditorProps> = ({
  initialContent = '',
  onChange,
  placeholder = 'Start writing... (Type ``` for code block)'
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const savedRange = useRef<Range | null>(null);

  // --- UI States ---
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Video Popup State
  const [showVideoInput, setShowVideoInput] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');

  // Initialize
  useEffect(() => {
    if (editorRef.current && initialContent && !editorRef.current.innerHTML) {
      editorRef.current.innerHTML = initialContent;
      // 🔥 Core Fix: Poll to check if window.hljs is loaded
      // CDN scripts are async, component might mount before script loads
      const checkHljs = setInterval(() => {
        if ((window as any).hljs) {
          highlightAllBlocks();
          clearInterval(checkHljs); // Clear interval after success
        }
      }, 500); // Check every 0.5s

      return () => clearInterval(checkHljs);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  // --- Highlight Logic ---
  const highlightAllBlocks = () => {
    const hljs = (window as any).hljs;
    if (!editorRef.current || !hljs) return;

    const blocks = editorRef.current.querySelectorAll('pre code');
    blocks.forEach((block) => {
      // Clear old attribute to force re-highlight
      block.removeAttribute('data-highlighted');
      hljs.highlightElement(block as HTMLElement);
    });
  };

  // --- Insert Code Block ---
  const insertCodeBlock = () => {
    // Use pre-wrap style to ensure newlines are rendered
    const html = `<pre class="code-block-wrapper" spellcheck="false"><code class="language-javascript">// Write code...</code></pre><p><br/></p>`;
    exec('insertHTML', html);
  };

  // --- 1. Selection Core (Fixed) ---
  const saveSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      if (editorRef.current && editorRef.current.contains(selection.anchorNode)) {
        // [Fix 1] Use cloneRange to prevent reference modification
        savedRange.current = selection.getRangeAt(0).cloneRange();
      }
    }
  };

  const restoreSelection = () => {
    const selection = window.getSelection();
    if (savedRange.current && selection) {
      selection.removeAllRanges();
      selection.addRange(savedRange.current);
    } else {
      editorRef.current?.focus();
    }
  };

  const exec = (command: string, value: string | undefined = undefined) => {
    // 1. Restore selection first
    restoreSelection();
    // 2. Execute command (use setTimeout 0 to run in next tick, better compatibility)
    setTimeout(() => {
      document.execCommand(command, false, value);
      // 3. Must refocus after execution, otherwise cannot continue typing
      editorRef.current?.focus();
      handleChange();
    }, 0);
    setActiveDropdown(null);
  };

  // --- 3. Feature: Insert Video (Custom UI) ---
  const confirmInsertVideo = () => {
    if (!videoUrl) {
      setShowVideoInput(false);
      return;
    }

    let embedUrl = videoUrl;
    // Simple naive parser for YouTube
    if (videoUrl.includes('youtube.com/watch?v=')) {
      const videoId = videoUrl.split('v=')[1]?.split('&')[0];
      embedUrl = `https://www.youtube.com/embed/${videoId}`;
    } else if (videoUrl.includes('youtu.be/')) {
      const videoId = videoUrl.split('youtu.be/')[1];
      embedUrl = `https://www.youtube.com/embed/${videoId}`;
    }

    const html = `
      <div class="my-4 relative w-full aspect-video rounded-lg overflow-hidden border border-gray-200 bg-gray-100 shadow-sm">
        <iframe src="${embedUrl}" class="w-full h-full" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
      </div>
      <p><br/></p>
    `;

    exec('insertHTML', html);
    setVideoUrl('');
    setShowVideoInput(false);
  };

  // --- 4. Feature: Insert Table ---
  const insertTable = () => {
    const html = `
      <div class="overflow-x-auto my-4">
        <table class="min-w-full border-collapse border border-gray-300 dark:border-gray-600 text-sm">
          <thead>
            <tr class="bg-gray-100 dark:bg-gray-800">
              <th class="border border-gray-300 dark:border-gray-600 p-2 text-left">Header 1</th>
              <th class="border border-gray-300 dark:border-gray-600 p-2 text-left">Header 2</th>
              <th class="border border-gray-300 dark:border-gray-600 p-2 text-left">Header 3</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="border border-gray-300 dark:border-gray-600 p-2">Data 1</td>
              <td class="border border-gray-300 dark:border-gray-600 p-2">Data 2</td>
              <td class="border border-gray-300 dark:border-gray-600 p-2">Data 3</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p><br/></p>
    `;
    exec('insertHTML', html);
  };

  // --- 🔥🔥🔥 Core Fix: Keyboard Event Interception ---
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const selection = window.getSelection();
    if (!selection?.anchorNode) return;

    let currentNode: Node | null = selection.anchorNode;
    // Find if we are inside a pre tag
    const parentBlock =
      currentNode.nodeType === 3 ? currentNode.parentElement : (currentNode as HTMLElement);
    const insideCodeBlock = parentBlock?.closest('pre');

    // 1. Tab Key: Insert two spaces
    if (e.key === 'Tab') {
      e.preventDefault();
      if (insideCodeBlock) {
        document.execCommand('insertText', false, '  ');
      } else {
        exec('indent');
      }
    }

    // 2. Enter Key Handling
    if (e.key === 'Enter') {
      if (insideCodeBlock) {
        // --- Shift + Enter: Break out of code block ---
        if (e.shiftKey) {
          e.preventDefault();
          const p = document.createElement('p');
          p.innerHTML = '<br>'; // Must add br, otherwise empty p has 0 height
          insideCodeBlock.after(p);

          // Move cursor to new p tag
          const range = document.createRange();
          range.setStart(p, 0);
          range.collapse(true);
          selection.removeAllRanges();
          selection.addRange(range);
          return;
        }

        // --- Normal Enter: Non-breaking newline ---
        e.preventDefault();

        // 1. Get current Range
        const range = selection.getRangeAt(0);

        // 2. Create a text node with newline
        const brNode = document.createTextNode('\n');

        // 3. Delete selection (if any) and insert newline
        range.deleteContents();
        range.insertNode(brNode);

        // 4. 🔥 Critical Step: Move cursor AFTER the newline
        // This tells the browser: "I am now on the new line"
        range.setStartAfter(brNode);
        range.setEndAfter(brNode);

        // 5. Update selection
        selection.removeAllRanges();
        selection.addRange(range);

        return;
      }
    }
  };

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    const selection = window.getSelection();
    if (!selection || !selection.anchorNode) return;

    const anchorNode = selection.anchorNode;
    const text = anchorNode.textContent || '';

    // Markdown Shortcuts
    // Trigger when space is typed
    if ((e.nativeEvent as InputEvent).data === ' ') {
      if (/^#\s$/.test(text)) {
        exec('formatBlock', 'H1');
        deleteTrigger(selection, 2);
      } else if (/^##\s$/.test(text)) {
        exec('formatBlock', 'H2');
        deleteTrigger(selection, 3);
      } else if (/^-\s$/.test(text)) {
        exec('insertUnorderedList');
        deleteTrigger(selection, 2);
      } else if (/^1\.\s$/.test(text)) {
        exec('insertOrderedList');
        deleteTrigger(selection, 3);
      } else if (/^>\s$/.test(text)) {
        exec(
          'insertHTML',
          '<blockquote class="border-l-4 border-blue-500 pl-4 italic text-gray-600 my-4 bg-gray-50 py-2 rounded-r">Quote</blockquote>'
        );
        deleteTrigger(selection, 2);
      } else if (/^```\s$/.test(text)) {
        deleteTrigger(selection, 4);
        insertCodeBlock();
      }
    }
    handleChange();
  };

  const deleteTrigger = (selection: Selection, len: number) => {
    const range = document.createRange();
    range.setStart(selection.anchorNode!, 0);
    range.setEnd(selection.anchorNode!, len);
    range.deleteContents();
  };

  // --- 6. Image Logic ---
  const processAndInsertImage = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setIsProcessing(true);
    try {
      const base64 = await compressImage(file, { quality: 0.7, maxWidth: 1000 });
      restoreSelection();
      const imgHtml = `<img src="${base64}" class="max-w-full h-auto rounded-lg my-4 shadow-md hover:shadow-lg transition-shadow duration-300" />`;
      document.execCommand('insertHTML', false, imgHtml);
      handleChange();
    } catch (error) {
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processAndInsertImage(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleChange = () => {
    if (editorRef.current && onChange) onChange(editorRef.current.innerHTML);
    saveSelection();
  };

  // --- 7. UI Sub-Components ---

  const ToolbarBtn = ({ icon, cmd, val, title, onMouseDown, isActive }: any) => (
    <button
      onMouseDown={(e) => {
        e.preventDefault(); // [Critical] Prevent button focus, keep editor selection
        if (onMouseDown) onMouseDown(e);
        else if (cmd) exec(cmd, val);
      }}
      className={`p-1.5 rounded-md transition-all w-8 h-8 flex items-center justify-center
        ${
          isActive
            ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300'
            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
        }
      `}
      title={title}
      disabled={isProcessing}
    >
      <i className={icon}></i>
    </button>
  );

  const Divider = () => <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1"></div>;

  return (
    <div className="flex flex-col border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 shadow-sm overflow-hidden h-full relative">
      {/* Loading Overlay */}
      {isProcessing && (
        <div className="absolute inset-0 z-50 bg-white/60 dark:bg-black/60 flex items-center justify-center backdrop-blur-sm">
          <i className="ri-loader-4-line text-3xl text-blue-500 animate-spin"></i>
        </div>
      )}

      {/* --- Toolbar --- */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 select-none z-20">
        <ToolbarBtn icon="ri-arrow-go-back-line" cmd="undo" />
        <ToolbarBtn icon="ri-arrow-go-forward-line" cmd="redo" />
        <Divider />
        <ToolbarBtn icon="ri-bold" cmd="bold" />
        <ToolbarBtn icon="ri-italic" cmd="italic" />
        <ToolbarBtn icon="ri-strikethrough" cmd="strikeThrough" />
        <ToolbarBtn icon="ri-underline" cmd="underline" />

        <Divider />

        {/* Font & Size */}
        <div className="flex gap-1 relative">
          <button
            className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-200 rounded dark:text-gray-300 dark:hover:bg-gray-700"
            onMouseDown={(e) => {
              e.preventDefault();
              setActiveDropdown(activeDropdown === 'font' ? null : 'font');
            }}
          >
            Font <i className="ri-arrow-down-s-line"></i>
          </button>
          {activeDropdown === 'font' && (
            <div className="absolute top-full left-0 w-40 bg-white dark:bg-gray-800 border dark:border-gray-700 shadow-xl rounded-md flex flex-col z-30 mt-1">
              {FONT_FAMILIES.map((font) => (
                <button
                  key={font.name}
                  className="text-left px-3 py-2 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-200"
                  style={{ fontFamily: font.value }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    exec('fontName', font.value);
                  }}
                >
                  {font.name}
                </button>
              ))}
            </div>
          )}

          <button
            className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-200 rounded dark:text-gray-300 dark:hover:bg-gray-700"
            onMouseDown={(e) => {
              e.preventDefault();
              setActiveDropdown(activeDropdown === 'size' ? null : 'size');
            }}
          >
            Size <i className="ri-arrow-down-s-line"></i>
          </button>
          {activeDropdown === 'size' && (
            <div className="absolute top-full left-0 w-24 bg-white dark:bg-gray-800 border dark:border-gray-700 shadow-xl rounded-md flex flex-col z-30 mt-1">
              {FONT_SIZES.map((size) => (
                <button
                  key={size.name}
                  className="text-left px-3 py-2 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-200"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    exec('fontSize', size.value);
                  }}
                >
                  {size.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <Divider />

        <ToolbarBtn icon="ri-list-unordered" cmd="insertUnorderedList" />
        <ToolbarBtn icon="ri-list-ordered" cmd="insertOrderedList" />
        <ToolbarBtn icon="ri-align-left" cmd="justifyLeft" />
        <ToolbarBtn icon="ri-align-center" cmd="justifyCenter" />

        <Divider />

        {/* Color & Emoji */}
        <div className="relative">
          <ToolbarBtn
            icon="ri-font-color"
            onMouseDown={() => setActiveDropdown(activeDropdown === 'color' ? null : 'color')}
          />
          {activeDropdown === 'color' && (
            <div className="absolute top-full left-0 mt-2 p-2 bg-white dark:bg-gray-800 border dark:border-gray-700 shadow-xl rounded-lg grid grid-cols-5 gap-1 z-30 w-40">
              {[
                '#000000',
                '#4B5563',
                '#EF4444',
                '#F59E0B',
                '#10B981',
                '#3B82F6',
                '#6366F1',
                '#8B5CF6'
              ].map((color) => (
                <button
                  key={color}
                  className="w-6 h-6 rounded-full border border-gray-100 hover:scale-110"
                  style={{ backgroundColor: color }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    exec('foreColor', color);
                  }}
                />
              ))}
            </div>
          )}
        </div>

        <div className="relative">
          <ToolbarBtn
            icon="ri-emotion-line"
            onMouseDown={() => setActiveDropdown(activeDropdown === 'emoji' ? null : 'emoji')}
          />
          {activeDropdown === 'emoji' && (
            <div className="absolute top-full left-0 mt-2 p-2 bg-white dark:bg-gray-800 border dark:border-gray-700 shadow-xl rounded-lg grid grid-cols-5 gap-1 z-30 w-48">
              {EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  className="text-lg hover:bg-gray-100 rounded p-1"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    exec('insertText', emoji);
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        <Divider />

        {/* --- Media Section --- */}

        {/* Table */}
        <ToolbarBtn icon="ri-table-2" title="Insert Table" onMouseDown={insertTable} />

        {/* Code Block */}
        <ToolbarBtn
          icon="ri-code-box-line"
          title="Insert Code Block"
          onMouseDown={(e: any) => {
            e.preventDefault();
            insertCodeBlock();
          }}
        />

        {/* Image */}
        <button
          className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 relative w-8 h-8 flex items-center justify-center"
          title="Insert Image"
          onMouseDown={(e) => {
            e.preventDefault();
            saveSelection();
            fileInputRef.current?.click();
          }}
        >
          <i className="ri-image-add-line"></i>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleFileChange}
          />
        </button>

        {/* Video (Custom Popover) */}
        <div className="relative">
          <ToolbarBtn
            icon="ri-video-add-line"
            title="Insert Video"
            isActive={showVideoInput}
            onMouseDown={() => {
              saveSelection();
              setShowVideoInput(!showVideoInput);
              setTimeout(() => document.getElementById('video-url-input')?.focus(), 50);
            }}
          />
          {showVideoInput && (
            <div className="absolute top-full right-0 mt-2 p-3 bg-white dark:bg-gray-800 border dark:border-gray-700 shadow-xl rounded-lg z-40 w-72 flex flex-col gap-2 animate-in fade-in slide-in-from-top-2">
              <span className="text-xs font-semibold text-gray-500">
                Embed Video (YouTube/Vimeo)
              </span>
              <input
                id="video-url-input"
                type="text"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://youtube.com/..."
                className="text-sm p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none w-full"
                onKeyDown={(e) => e.key === 'Enter' && confirmInsertVideo()}
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowVideoInput(false)}
                  className="text-xs px-2 py-1 text-gray-500 hover:bg-gray-100 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmInsertVideo}
                  className="text-xs px-3 py-1 bg-blue-600 text-white hover:bg-blue-700 rounded font-medium"
                >
                  Insert
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* --- Editor Content --- */}
      <div
        ref={editorRef}
        className="flex-1 p-6 outline-none overflow-y-auto prose prose-slate dark:prose-invert max-w-none custom-scrollbar"
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        // 🔥 Must bind KeyDown
        onKeyDown={(e) => {
          handleKeyDown(e);
          // Do not saveSelection in KeyDown immediately, as cursor hasn't moved yet
        }}
        // [Fix 2] Add onKeyUp to ensure selection is saved after keyboard nav
        onKeyUp={saveSelection}
        onMouseUp={saveSelection}
        onBlur={() => {
          saveSelection();
          highlightAllBlocks(); // Try highlight on blur
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (e.dataTransfer.files?.[0]) processAndInsertImage(e.dataTransfer.files[0]);
        }}
        onDragOver={(e) => e.preventDefault()}
        onPaste={(e) => {
          if (e.clipboardData.files?.[0]) {
            e.preventDefault();
            processAndInsertImage(e.clipboardData.files[0]);
          }
        }}
        data-placeholder={placeholder}
      />

      {/* Footer */}
      <div className="bg-gray-50 dark:bg-slate-950 text-[10px] text-gray-400 p-2 px-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center shrink-0">
        <div className="flex gap-3">
          <span>CHARS: {editorRef.current?.textContent?.length || 0}</span>
        </div>
        <span className="font-semibold tracking-wide text-gray-300 dark:text-gray-600">
          BY EDITOR V3
        </span>
      </div>

      <style>{`
        [contenteditable]:empty:before { content: attr(data-placeholder); color: #9ca3af; pointer-events: none; }
        .prose table { width: 100%; text-align: left; margin-top: 1em; margin-bottom: 1em; }
        .prose td, .prose th { border: 1px solid #e5e7eb; padding: 0.5rem; }
        .dark .prose td, .dark .prose th { border-color: #374151; }
        img::selection { background: transparent; }
        
        /* Core: Ensure pre tag newline behavior is correct */
        pre { 
            white-space: pre-wrap; 
            word-wrap: break-word; 
            background-color: #282c34 !important; /* Force dark bg */
            color: #abb2bf !important; /* Force light text */
            font-family: 'Fira Code', 'Roboto Mono', monospace;
        }
        
        /* Prevent browser default code styling override */
        pre code {
            background-color: transparent !important;
            color: inherit !important;
            padding: 0 !important;
        }
        /* Code block wrapper (Atom One Dark style) */
        .code-block-wrapper { 
            background-color: #282c34; 
            color: #abb2bf; 
            padding: 1rem; 
            border-radius: 0.5rem; 
            margin: 1rem 0;
            font-family: 'Fira Code', monospace;
            white-space: pre-wrap; /* Allow wrapping */
            word-wrap: break-word;
        }
        /* Avoid hljs own bg color covering our rounded corners */
        .hljs { background: transparent !important; padding: 0 !important; }
      `}</style>
    </div>
  );
};