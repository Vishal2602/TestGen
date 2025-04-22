import { useAppState } from '@/hooks/useAppState';
import { getStatusColor, getStatusIcon, getCategoryNameDisplay } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { TestCategory } from '@shared/schema';

const GenerationProgress = () => {
  const functionTests = useAppState((state) => state.functionTests);
  const apiLogs = useAppState((state) => state.apiLogs);
  
  // Calculate overall progress
  const totalFunctions = functionTests.length;
  const completedFunctions = functionTests.filter(test => test.status === 'completed').length;
  const progressPercentage = totalFunctions > 0 ? (completedFunctions / totalFunctions) * 100 : 0;
  
  const renderTestCategoryStatus = (functionName: string, category: TestCategory) => {
    const functionTest = functionTests.find(test => test.functionName === functionName);
    if (!functionTest) return null;
    
    const result = functionTest.results.find(result => result.category === category);
    if (!result) return null;
    
    return (
      <div className="flex items-center">
        <i className={getStatusIcon(result.status) + " mr-2"}></i>
        <span className={`text-sm ${result.status === 'pending' || result.status === 'in_progress' ? 'text-neutral-500' : 'text-neutral-700'}`}>
          {getCategoryNameDisplay(category)}
        </span>
        {result.count > 0 && result.status === 'completed' && (
          <span className="ml-auto text-xs text-neutral-500">{result.count} tests</span>
        )}
      </div>
    );
  };

  return (
    <div className="p-5">
      {/* Overall Progress */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-medium text-neutral-700">Overall Progress</h3>
          <span className="text-sm text-neutral-600">
            {completedFunctions}/{totalFunctions} functions
          </span>
        </div>
        <Progress 
          value={progressPercentage} 
          className="w-full h-2.5 bg-neutral-200" 
        />
      </div>
      
      {/* Function Progress List */}
      <div className="space-y-5">
        {functionTests.length === 0 ? (
          <div className="text-center py-8 text-neutral-500">
            No functions to process. Please upload code and proceed to analysis.
          </div>
        ) : (
          functionTests.map((test, index) => (
            <div key={index} className="border rounded-lg overflow-hidden">
              <div className="px-4 py-3 bg-neutral-50 border-b flex justify-between items-center">
                <div>
                  <span className="font-medium text-neutral-800">{test.functionName}</span>
                  <span className="text-xs text-neutral-500 ml-2">{test.fileName}</span>
                </div>
                <div className="flex items-center">
                  <span className={`text-xs px-2 py-0.5 rounded ${getStatusColor(test.status)}`}>
                    {test.status === 'pending' && 'Pending'}
                    {test.status === 'in_progress' && 'In Progress'}
                    {test.status === 'completed' && 'Completed'}
                    {test.status === 'failed' && 'Failed'}
                  </span>
                </div>
              </div>
              <div className="px-4 py-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-xs font-medium text-neutral-700 mb-2">Whitebox Tests</h4>
                    <div className="space-y-2">
                      {renderTestCategoryStatus(test.functionName, 'whitebox_statement')}
                      {renderTestCategoryStatus(test.functionName, 'whitebox_branch')}
                      {renderTestCategoryStatus(test.functionName, 'whitebox_path')}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-medium text-neutral-700 mb-2">Blackbox Tests</h4>
                    <div className="space-y-2">
                      {renderTestCategoryStatus(test.functionName, 'blackbox_boundary')}
                      {renderTestCategoryStatus(test.functionName, 'blackbox_equivalence')}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* API Status Panel */}
      <div className="mt-8 border rounded-lg overflow-hidden">
        <div className="bg-neutral-50 px-5 py-3 border-b border-neutral-100">
          <h3 className="text-sm font-medium text-neutral-700">API Status</h3>
        </div>
        <div className="p-4 max-h-48 overflow-y-auto font-mono text-xs text-neutral-600 bg-neutral-50">
          {apiLogs.length === 0 ? (
            <div className="text-neutral-400">No API activity yet...</div>
          ) : (
            apiLogs.map((log, index) => (
              <div key={index}>{log}</div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default GenerationProgress;
