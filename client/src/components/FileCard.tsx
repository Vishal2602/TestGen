import { useState } from 'react';
import { X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { UploadedFile } from '@/lib/types';

interface FileCardProps {
  file: UploadedFile;
  onRemove: (id: string) => void;
}

export function FileCard({ file, onRemove }: FileCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Format file size
  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Get badge class based on file type
  const getBadgeClass = (): string => {
    switch (file.type) {
      case 'js':
      case 'jsx':
        return 'bg-[#f7df1e] text-black';
      case 'ts':
      case 'tsx':
        return 'bg-[#3178c6] text-white';
      case 'md':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-200 text-gray-800';
    }
  };

  // Get badge text based on file type
  const getBadgeText = (): string => {
    switch (file.type) {
      case 'js': return 'JS';
      case 'jsx': return 'JSX';
      case 'ts': return 'TS';
      case 'tsx': return 'TSX';
      case 'md': return 'MD';
      default: return '?';
    }
  };

  // Limit code preview
  const getCodePreview = (): string => {
    const MAX_LINES = 10;
    const lines = file.content.split('\n');
    if (isExpanded || lines.length <= MAX_LINES) return file.content;
    return lines.slice(0, MAX_LINES).join('\n') + '\n...';
  };

  return (
    <Card className="overflow-hidden transition-all hover:-translate-y-1 hover:shadow-md">
      <div className="p-3 border-b border-border flex justify-between items-center">
        <div className="flex items-center">
          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mr-2 ${getBadgeClass()}`}>
            {getBadgeText()}
          </span>
          <span className="text-sm font-medium truncate" title={file.name}>
            {file.name}
          </span>
        </div>
        <button 
          className="text-muted-foreground hover:text-foreground transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(file.id);
          }}
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      
      <div 
        className="px-3 py-2 bg-muted/30 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <pre className="text-xs max-h-24 overflow-y-auto font-mono">{getCodePreview()}</pre>
      </div>
      
      <CardContent className="p-3 text-xs text-muted-foreground">
        <div className="flex justify-between items-center">
          <span>
            {file.isSpecFile 
              ? 'Specifications file' 
              : file.functionCount !== undefined 
                ? `${file.functionCount} functions detected` 
                : 'Code file'}
          </span>
          <span>{formatSize(file.size)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
