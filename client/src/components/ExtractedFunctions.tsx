import { useAppState } from '@/hooks/useAppState';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FunctionInfo } from '@shared/schema';
import CodeViewer from './CodeViewer';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const ExtractedFunctions = () => {
  const functions = useAppState((state) => state.functions);
  const [selectedFunction, setSelectedFunction] = useState<FunctionInfo | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [excludedFunctions, setExcludedFunctions] = useState<string[]>([]);

  const toggleExcludeFunction = (functionName: string) => {
    if (excludedFunctions.includes(functionName)) {
      setExcludedFunctions(excludedFunctions.filter(name => name !== functionName));
    } else {
      setExcludedFunctions([...excludedFunctions, functionName]);
    }
  };

  const viewFunctionCode = (func: FunctionInfo) => {
    setSelectedFunction(func);
    setOpenDialog(true);
  };

  return (
    <div className="p-5">
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-neutral-700">Extracted Functions</h3>
          <div className="text-sm">
            <button className="text-primary-500 hover:text-primary-600">
              <i className="ri-filter-3-line mr-1"></i>
              Filter
            </button>
          </div>
        </div>
        <p className="text-xs text-neutral-500 mt-1">
          Confirm that the functions below match your project code
        </p>
      </div>
      
      <div className="border rounded-lg overflow-hidden">
        {/* Function heading */}
        <div className="bg-neutral-50 px-4 py-2 grid grid-cols-12 gap-4 border-b text-xs font-medium text-neutral-600">
          <div className="col-span-3">Function Name</div>
          <div className="col-span-2">File</div>
          <div className="col-span-3">Parameters</div>
          <div className="col-span-2">Return Type</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>
        
        {/* Function list */}
        <div className="max-h-80 overflow-y-auto">
          {functions.length === 0 ? (
            <div className="px-4 py-8 text-center text-neutral-500">
              No functions extracted yet. Please upload JavaScript files to analyze.
            </div>
          ) : (
            functions.map((func, index) => (
              <div 
                key={`${func.name}-${index}`} 
                className={`px-4 py-3 grid grid-cols-12 gap-4 border-b text-sm hover:bg-neutral-50 ${
                  excludedFunctions.includes(func.name) ? 'opacity-50' : ''
                }`}
              >
                <div className="col-span-3 font-medium text-neutral-800">
                  {func.name}
                </div>
                <div className="col-span-2 text-neutral-600 text-xs">
                  {func.fileName}
                </div>
                <div className="col-span-3 font-mono text-xs text-neutral-600">
                  {func.params.map(p => `${p.name}${p.type ? ': ' + p.type : ''}`).join(', ')}
                </div>
                <div className="col-span-2 font-mono text-xs text-neutral-600">
                  {func.returnType || 'unknown'}
                </div>
                <div className="col-span-2 text-right">
                  <button 
                    className="text-primary-500 hover:text-primary-600 mr-2" 
                    title="View code"
                    onClick={() => viewFunctionCode(func)}
                  >
                    <i className="ri-code-line"></i>
                  </button>
                  <button 
                    className={`${
                      excludedFunctions.includes(func.name) 
                        ? 'text-neutral-600 hover:text-neutral-800' 
                        : 'text-neutral-400 hover:text-neutral-600'
                    }`} 
                    title={excludedFunctions.includes(func.name) ? "Include in testing" : "Exclude from testing"}
                    onClick={() => toggleExcludeFunction(func.name)}
                  >
                    <i className={excludedFunctions.includes(func.name) ? "ri-eye-line" : "ri-eye-off-line"}></i>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Function code viewer dialog */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {selectedFunction?.name}
              <span className="ml-2 text-sm font-normal text-neutral-500">
                ({selectedFunction?.fileName})
              </span>
            </DialogTitle>
          </DialogHeader>
          {selectedFunction && (
            <div className="mt-2">
              <CodeViewer code={selectedFunction.code} language="javascript" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExtractedFunctions;
