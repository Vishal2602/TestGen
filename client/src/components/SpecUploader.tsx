import { useCallback, useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { formatFileSize, isMarkdownFile, readFileAsText } from '@/lib/utils';
import { useAppState } from '@/hooks/useAppState';
import { FilePreview } from '@/lib/types';

const SpecUploader = () => {
  const specFile = useAppState((state) => state.specFile);
  const setSpecFile = useAppState((state) => state.setSpecFile);
  
  const [filePreview, setFilePreview] = useState<FilePreview | null>(null);

  useEffect(() => {
    if (specFile) {
      const loadPreview = async () => {
        const content = await readFileAsText(specFile);
        setFilePreview({
          name: specFile.name,
          size: formatFileSize(specFile.size),
          content
        });
      };
      
      loadPreview();
    } else {
      setFilePreview(null);
    }
  }, [specFile]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0]; // Take only the first file
      if (isMarkdownFile(file)) {
        setSpecFile(file);
      }
    }
  }, [setSpecFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/markdown': ['.md'],
      'text/plain': ['.txt']
    },
    multiple: false
  });

  const handleRemoveFile = () => {
    setSpecFile(null);
  };

  return (
    <div className="p-5">
      <div 
        {...getRootProps()} 
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragActive ? 'border-primary-300 bg-primary-50' : 'border-neutral-200 hover:border-primary-300'
        }`}
      >
        <i className="ri-file-text-line text-4xl text-neutral-400"></i>
        <p className="mt-4 mb-2 text-neutral-700">
          {isDragActive 
            ? "Drop the README.md file here" 
            : "Drag and drop README.md file here"}
        </p>
        <p className="text-sm text-neutral-500 mb-4">or</p>
        <button className="bg-primary-500 hover:bg-primary-600 text-white rounded px-4 py-2 text-sm transition">
          Browse Files
        </button>
        <input {...getInputProps()} />
      </div>
      
      {/* Spec file preview */}
      <div className="mt-4">
        <div className="text-sm text-neutral-500 mb-2">
          {filePreview ? '1 file selected' : 'No file selected'}
        </div>
        
        {!filePreview ? (
          <div className="bg-neutral-50 rounded-lg p-4 text-center">
            <p className="text-neutral-500 text-sm">No specification file uploaded yet</p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-neutral-50 px-4 py-3 flex items-center justify-between border-b">
              <div className="flex items-center">
                <i className="ri-markdown-line text-blue-500 mr-2"></i>
                <span className="text-sm font-medium text-neutral-700">
                  {filePreview.name}
                </span>
                <span className="text-xs text-neutral-500 ml-2">
                  {filePreview.size}
                </span>
              </div>
              <button 
                className="text-neutral-400 hover:text-error-500"
                onClick={handleRemoveFile}
              >
                <i className="ri-delete-bin-line"></i>
              </button>
            </div>
            <div className="p-4 max-h-60 overflow-y-auto">
              <pre className="text-xs font-mono whitespace-pre-wrap text-neutral-700">
                {filePreview.content}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SpecUploader;
