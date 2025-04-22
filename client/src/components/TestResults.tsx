import { useState } from 'react';
import { useAppState } from '@/hooks/useAppState';
import CodeViewer from './CodeViewer';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/queryClient';
import { getCategoryNameDisplay } from '@/lib/utils';
import { TestFile, CICDFile } from '@shared/schema';

const TestResults = () => {
  const testFiles = useAppState((state) => state.testFiles);
  const cicdFiles = useAppState((state) => state.cicdFiles);
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({});

  const toggleAccordion = (fileName: string) => {
    setOpenAccordions({
      ...openAccordions,
      [fileName]: !openAccordions[fileName]
    });
  };

  const downloadFile = async (file: TestFile | CICDFile) => {
    const blob = new Blob([file.content], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadAllFiles = async () => {
    try {
      const response = await apiRequest('GET', '/api/tests/download', {});
      const link = document.createElement('a');
      link.href = response.url;
      link.download = 'test-files.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading all files:', error);
    }
  };

  // Count total tests
  const totalTests = testFiles.reduce((sum, file) => sum + file.testCount, 0);

  return (
    <div className="p-5">
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-neutral-700">Test Overview</h3>
          <div>
            <span className="text-xs bg-neutral-100 text-neutral-700 px-2 py-1 rounded-full mr-2">
              <i className="ri-file-list-line mr-1"></i>
              {testFiles.length} Files
            </span>
            <span className="text-xs bg-neutral-100 text-neutral-700 px-2 py-1 rounded-full">
              <i className="ri-test-tube-line mr-1"></i>
              {totalTests} Tests
            </span>
          </div>
        </div>
      </div>
      
      {/* Test Files Accordion */}
      {testFiles.length === 0 ? (
        <div className="text-center py-8 text-neutral-500 border rounded-lg">
          No test files generated yet. Run the test generation to see results.
        </div>
      ) : (
        <div className="space-y-4">
          {testFiles.map((file, index) => (
            <div key={index} className="border rounded-lg overflow-hidden">
              <div 
                className="px-4 py-3 bg-neutral-50 border-b flex justify-between items-center cursor-pointer"
                onClick={() => toggleAccordion(file.name)}
              >
                <div className="flex items-center">
                  <i className="ri-test-tube-line text-primary-500 mr-2"></i>
                  <span className="font-medium text-neutral-800">{file.name}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-xs text-neutral-500 mr-3">{file.testCount} tests</span>
                  <i className={`ri-arrow-${openAccordions[file.name] ? 'up' : 'down'}-s-line text-neutral-500`}></i>
                </div>
              </div>
              
              {openAccordions[file.name] && (
                <div className="p-4">
                  <div className="mb-4 flex justify-between items-center">
                    <div className="flex items-center">
                      <span className="text-xs font-medium text-neutral-700 mr-2">Test Categories:</span>
                      {file.categories.map((category, idx) => (
                        <span 
                          key={idx} 
                          className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded mr-2"
                        >
                          {getCategoryNameDisplay(category)}
                        </span>
                      ))}
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-xs text-primary-500 hover:text-primary-600"
                      onClick={() => downloadFile(file)}
                    >
                      <i className="ri-download-line mr-1"></i>
                      Download
                    </Button>
                  </div>
                  
                  <CodeViewer code={file.content} language="javascript" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* CI/CD Integration Files */}
      {cicdFiles.length > 0 && (
        <div className="mt-8">
          <h3 className="text-sm font-medium text-neutral-700 mb-4">CI/CD Integration</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {cicdFiles.map((file, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-neutral-700">{file.name}</h4>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-xs text-primary-500 hover:text-primary-600"
                    onClick={() => downloadFile(file)}
                  >
                    <i className="ri-download-line mr-1"></i>
                    Download
                  </Button>
                </div>
                <CodeViewer 
                  code={file.content} 
                  language={file.fileType === 'package_json' ? 'json' : 'yaml'} 
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TestResults;
