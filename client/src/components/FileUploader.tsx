import { useCallback, useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { formatFileSize, isJavaScriptFile } from '@/lib/utils';
import { useAppState } from '@/hooks/useAppState';
import { UploadedJsFile } from '@/lib/types';

const FileUploader = () => {
  const jsFiles = useAppState((state) => state.jsFiles);
  const addJsFiles = useAppState((state) => state.addJsFiles);
  const removeJsFile = useAppState((state) => state.removeJsFile);
  
  const [uploadedFiles, setUploadedFiles] = useState<UploadedJsFile[]>([]);

  useEffect(() => {
    // Convert the stored File objects to UploadedJsFile for display
    setUploadedFiles(
      jsFiles.map((file) => ({
        file,
        fileName: file.name,
        size: formatFileSize(file.size)
      }))
    );
  }, [jsFiles]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const validFiles = acceptedFiles.filter(isJavaScriptFile);
    if (validFiles.length > 0) {
      addJsFiles(validFiles);
    }
  }, [addJsFiles]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/javascript': ['.js', '.ts', '.jsx', '.tsx'],
    },
    multiple: true
  });

  const handleRemoveFile = (fileName: string) => {
    removeJsFile(fileName);
  };

  return (
    <div className="p-5">
      <div 
        {...getRootProps()} 
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragActive ? 'border-primary-300 bg-primary-50' : 'border-neutral-200 hover:border-primary-300'
        }`}
      >
        <i className="ri-upload-cloud-2-line text-4xl text-neutral-400"></i>
        <p className="mt-4 mb-2 text-neutral-700">
          {isDragActive 
            ? "Drop the JavaScript files here" 
            : "Drag and drop JavaScript files here"}
        </p>
        <p className="text-sm text-neutral-500 mb-4">or</p>
        <button className="bg-primary-500 hover:bg-primary-600 text-white rounded px-4 py-2 text-sm transition">
          Browse Files
        </button>
        <input {...getInputProps()} />
      </div>
      
      {/* List of uploaded files */}
      <div className="mt-4">
        <div className="text-sm text-neutral-500 mb-2">
          {uploadedFiles.length} {uploadedFiles.length === 1 ? 'file' : 'files'} selected
        </div>
        
        {uploadedFiles.length === 0 ? (
          <div className="bg-neutral-50 rounded-lg p-4 text-center">
            <p className="text-neutral-500 text-sm">No JavaScript files uploaded yet</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {uploadedFiles.map((file, index) => (
              <li 
                key={`${file.fileName}-${index}`} 
                className="flex items-center justify-between bg-neutral-50 rounded px-4 py-3"
              >
                <div className="flex items-center">
                  <i className="ri-javascript-line text-yellow-500 mr-3"></i>
                  <span className="text-sm text-neutral-700">{file.fileName}</span>
                  <span className="text-xs text-neutral-500 ml-2">{file.size}</span>
                </div>
                <button 
                  className="text-neutral-400 hover:text-error-500"
                  onClick={() => handleRemoveFile(file.fileName)}
                >
                  <i className="ri-delete-bin-line"></i>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default FileUploader;
