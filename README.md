# BY Editor

A modern, lightweight rich-text editor component for React applications. Designed to be simple, fast, and easy to integrate.

## Features

- **Rich Text Formatting**: Bold, Italic, Strikethrough, Underline, Fonts, and Colors.
- **Markdown Shortcuts**: 
  - Type `# ` for H1, `## ` for H2.
  - Type `- ` or `1. ` for lists.
  - Type `> ` for blockquotes.
  - Type ` ``` ` for code blocks.
- **Syntax Highlighting**: Integrated with Highlight.js for beautiful code blocks (Atom One Dark theme).
- **Media Support**: 
  - **Images**: Automatic client-side compression before insertion.
  - **Videos**: Easy embedding for YouTube and Vimeo.
- **Tables**: Insert and edit responsive tables.
- **Dark Mode**: Fully compatible with Tailwind CSS dark mode.

## Tech Stack

- **React**: Core UI library.
- **Tailwind CSS**: For styling and theming.
- **RemixIcon**: For modern, clean icons.
- **Highlight.js**: For code syntax highlighting.

## Usage

Import the component into your React application:

```tsx
import { ByEditor } from './components/ByEditor';

const MyPage = () => {
  const handleEditorChange = (html: string) => {
    console.log('Editor content:', html);
  };

  return (
    <div className="editor-wrapper">
      <ByEditor 
        initialContent="<p>Start writing...</p>" 
        onChange={handleEditorChange} 
        placeholder="Type something amazing..." 
      />
    </div>
  );
};
```

## Credits

Built with ❤️ by **Sam Yao**.
