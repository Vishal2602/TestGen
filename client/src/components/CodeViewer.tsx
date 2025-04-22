import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface CodeViewerProps {
  code: string;
  language: string;
}

const CodeViewer: React.FC<CodeViewerProps> = ({ code, language }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="border rounded overflow-hidden bg-neutral-800">
      <div className="flex items-center justify-between px-4 py-2 bg-neutral-900">
        <div className="text-xs text-white font-mono">
          {language === 'javascript' 
            ? 'JavaScript' 
            : language === 'json' 
              ? 'JSON' 
              : language === 'yaml' 
                ? 'YAML' 
                : 'Code'}
        </div>
        <div>
          <Button 
            variant="ghost" 
            size="sm"
            className="text-neutral-400 hover:text-white text-xs h-6 px-2"
            onClick={copyToClipboard}
          >
            <i className={copied ? "ri-check-line mr-1" : "ri-file-copy-line mr-1"}></i>
            {copied ? 'Copied!' : 'Copy'}
          </Button>
        </div>
      </div>
      <div className="max-h-[400px] overflow-auto">
        <SyntaxHighlighter 
          language={language} 
          style={vscDarkPlus}
          customStyle={{ margin: 0, padding: '1rem', background: '#1e1e1e' }}
          showLineNumbers={true}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
};

export default CodeViewer;
