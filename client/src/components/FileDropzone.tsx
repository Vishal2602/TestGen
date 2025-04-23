import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UploadedFile } from '@/lib/types';
import { nanoid } from 'nanoid';

interface FileDropzoneProps {
  onFilesAdded: (files: UploadedFile[]) => void;
}

export function FileDropzone({ onFilesAdded }: FileDropzoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const filePromises = acceptedFiles.map(async (file) => {
        // Check if the file is a valid type
        const validTypes = ['.js', '.ts', '.jsx', '.tsx', '.md'];
        const isValid = validTypes.some(type => file.name.endsWith(type)) || 
                        file.type === 'application/javascript' || 
                        file.type === 'text/javascript' ||
                        file.type === 'application/typescript' ||
                        file.type === 'text/markdown';
        
        if (!isValid) {
          return null;
        }

        // Read file content
        const text = await file.text();
        
        // Determine file type
        let fileType: UploadedFile['type'] = 'unknown';
        if (file.name.endsWith('.js')) fileType = 'js';
        else if (file.name.endsWith('.ts')) fileType = 'ts';
        else if (file.name.endsWith('.jsx')) fileType = 'jsx';
        else if (file.name.endsWith('.tsx')) fileType = 'tsx';
        else if (file.name.endsWith('.md')) fileType = 'md';
        
        return {
          id: nanoid(),
          name: file.name,
          content: text,
          size: file.size,
          type: fileType,
          isSpecFile: file.name.endsWith('.md') || file.name.toLowerCase().includes('readme'),
          functionCount: undefined
        } as UploadedFile;
      });

      const uploadedFiles = (await Promise.all(filePromises)).filter(Boolean) as UploadedFile[];
      if (uploadedFiles.length > 0) {
        onFilesAdded(uploadedFiles);
      }
    },
    [onFilesAdded]
  );

  const { getRootProps, getInputProps, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'text/javascript': ['.js', '.jsx'],
      'application/javascript': ['.js', '.jsx'],
      'application/typescript': ['.ts', '.tsx'],
      'text/markdown': ['.md'],
      'text/plain': ['.js', '.ts', '.jsx', '.tsx', '.md']
    },
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
    onDropAccepted: () => setIsDragActive(false),
    onDropRejected: () => setIsDragActive(false)
  });

  return (
    <div 
      {...getRootProps()} 
      className={`rounded-lg p-8 text-center mb-6 border-2 border-dashed transition-all ${
        isDragActive 
          ? 'border-primary bg-primary/5' 
          : isDragReject 
            ? 'border-destructive bg-destructive/5' 
            : 'border-border'
      }`}
    >
      <input {...getInputProps()} />
      <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
      <p className="text-muted-foreground mb-2">Drag and drop files here or</p>
      <Button>Browse files</Button>
      <p className="text-sm text-muted-foreground mt-2">Accepts .js, .ts, .jsx, .tsx, and .md files</p>
    </div>
  );
}
