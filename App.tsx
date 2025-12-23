import React, { useState } from 'react';
import { ByEditor } from './components/ByEditor';

const App: React.FC = () => {
  const [content, setContent] = useState<string>('<h2>Welcome to BY Editor</h2><p>This is a <b>rich text editor</b> built for modern React applications.</p><ul><li>Supports Markdown shortcuts</li><li>Image compression & upload</li><li>Syntax highlighting</li></ul><pre class="code-block-wrapper" spellcheck="false"><code class="language-javascript">console.log("Hello World");</code></pre><p><br/></p>');
  const [darkMode, setDarkMode] = useState(false);

  const toggleTheme = () => {
    setDarkMode(!darkMode);
    if (!darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <div className={`min-h-screen p-4 md:p-8 flex flex-col items-center gap-6 ${darkMode ? 'dark' : ''}`}>
      
      {/* Header */}
      <header className="w-full max-w-5xl flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-blue-500/30">
            B
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white tracking-tight">BY Editor</h1>
            <p className="text-xs text-gray-500 font-medium">LIGHTWEIGHT TOOLKIT</p>
          </div>
        </div>
        <button 
          onClick={toggleTheme}
          className="p-2 rounded-full bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 shadow-sm border border-gray-200 dark:border-gray-700 hover:scale-105 transition-transform"
        >
          {darkMode ? <i className="ri-sun-line text-xl"></i> : <i className="ri-moon-line text-xl"></i>}
        </button>
      </header>

      {/* Editor Container */}
      <main className="w-full max-w-5xl h-[600px] shadow-2xl rounded-xl overflow-hidden ring-1 ring-black/5">
        <ByEditor 
          initialContent={content} 
          onChange={(html) => setContent(html)} 
          placeholder="Start typing your masterpiece..." 
        />
      </main>

      {/* Preview Section */}
      <section className="w-full max-w-5xl mt-8">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Live HTML Output</h3>
        <div className="bg-gray-900 rounded-xl p-4 overflow-x-auto shadow-inner border border-gray-800">
          <pre className="text-xs text-green-400 font-mono leading-relaxed">
            {content}
          </pre>
        </div>
      </section>

      <footer className="text-center text-gray-400 text-sm mt-12 pb-8">
        <p>Built with React, Tailwind, and Highlight.js by Sam Yao</p>
      </footer>
    </div>
  );
};

export default App;