import React, { useState } from 'react';
import { ByEditor } from './components/ByEditor';

// Translation dictionary for App-level text
const APP_TEXT = {
  en: {
    subtitle: 'LIGHTWEIGHT TOOLKIT',
    intro: 'A modern, lightweight rich-text editor component for React applications. Built for speed, simplicity, and ease of use.',
    preview: 'Live HTML Output',
    footer: 'Built with React, Tailwind, and Highlight.js by Sam Yao'
  },
  zh: {
    subtitle: '轻量级富文本工具包',
    intro: '专为 React 应用打造的现代化、轻量级富文本编辑器组件。追求极致的速度、简洁与易用性。',
    preview: 'HTML 实时预览',
    footer: '由 Sam Yao 基于 React, Tailwind 和 Highlight.js 构建'
  }
};

const App: React.FC = () => {
  const [content, setContent] = useState<string>('<h2>Welcome to BY Editor</h2><p>This is a <b>rich text editor</b> built for modern React applications.</p><ul><li>Supports Markdown shortcuts</li><li>Image compression & upload</li><li>Syntax highlighting</li><li>Smart Paste Cleaning</li></ul><pre class="code-block-wrapper" spellcheck="false"><code class="language-javascript">console.log("Hello World");</code></pre><p><br/></p>');
  const [darkMode, setDarkMode] = useState(false);
  const [lang, setLang] = useState<'en' | 'zh'>('en');

  const toggleTheme = () => {
    setDarkMode(!darkMode);
    if (!darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const toggleLang = () => {
    setLang(prev => prev === 'en' ? 'zh' : 'en');
  };

  const t = APP_TEXT[lang];

  return (
    <div className={`min-h-screen p-4 md:p-8 flex flex-col items-center gap-6 ${darkMode ? 'dark' : ''}`}>
      
      {/* Header */}
      <header className="w-full max-w-5xl flex flex-col gap-4 mb-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-blue-500/30">
              B
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white tracking-tight">BY Editor</h1>
              <p className="text-xs text-gray-500 font-medium">{t.subtitle}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={toggleLang}
              className="px-3 py-1.5 rounded-full bg-white dark:bg-gray-800 text-xs font-bold text-gray-600 dark:text-gray-300 shadow-sm border border-gray-200 dark:border-gray-700 hover:scale-105 transition-transform"
            >
              {lang === 'en' ? 'EN' : '中'}
            </button>
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-full bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 shadow-sm border border-gray-200 dark:border-gray-700 hover:scale-105 transition-transform"
            >
              {darkMode ? <i className="ri-sun-line text-xl"></i> : <i className="ri-moon-line text-xl"></i>}
            </button>
          </div>
        </div>
        
        {/* Short Introduction */}
        <p className="text-sm text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border-l-4 border-blue-500">
          {t.intro}
        </p>
      </header>

      {/* Editor Container */}
      <main className="w-full max-w-5xl h-[600px] shadow-2xl rounded-xl overflow-hidden ring-1 ring-black/5">
        <ByEditor 
          initialContent={content} 
          onChange={(html) => setContent(html)} 
        />
      </main>

      {/* Preview Section */}
      <section className="w-full max-w-5xl mt-8">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">{t.preview}</h3>
        <div className="bg-gray-900 rounded-xl p-4 overflow-x-auto shadow-inner border border-gray-800">
          <pre className="text-xs text-green-400 font-mono leading-relaxed">
            {content}
          </pre>
        </div>
      </section>

      <footer className="text-center text-gray-400 text-sm mt-12 pb-8">
        <p>{t.footer}</p>
      </footer>
    </div>
  );
};

export default App;