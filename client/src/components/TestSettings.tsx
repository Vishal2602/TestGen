import { useAppState } from '@/hooks/useAppState';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const TestSettings = () => {
  const testTypes = useAppState((state) => state.testTypes);
  const setTestTypes = useAppState((state) => state.setTestTypes);
  const apiKey = useAppState((state) => state.apiKey);
  const setApiKey = useAppState((state) => state.setApiKey);
  const modelVersion = useAppState((state) => state.modelVersion);
  const setModelVersion = useAppState((state) => state.setModelVersion);
  const testFramework = useAppState((state) => state.testFramework);
  const setTestFramework = useAppState((state) => state.setTestFramework);

  const handleWhiteboxChange = (checked: boolean | 'indeterminate') => {
    if (typeof checked === 'boolean') {
      setTestTypes({
        ...testTypes,
        whitebox: {
          statement: checked,
          branch: checked,
          path: checked && testTypes.whitebox.path
        }
      });
    }
  };

  const handleBlackboxChange = (checked: boolean | 'indeterminate') => {
    if (typeof checked === 'boolean') {
      setTestTypes({
        ...testTypes,
        blackbox: {
          boundary: checked,
          equivalence: checked
        }
      });
    }
  };

  return (
    <div className="p-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <h3 className="text-sm font-medium text-neutral-700 mb-3">Test Types</h3>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Checkbox 
                id="whitebox" 
                checked={testTypes.whitebox.statement || testTypes.whitebox.branch || testTypes.whitebox.path}
                onCheckedChange={handleWhiteboxChange}
              />
              <div>
                <Label htmlFor="whitebox" className="text-sm font-medium text-neutral-800">
                  Whitebox Tests
                  <span className="text-neutral-500 ml-1">(code-based)</span>
                </Label>
              </div>
            </div>
            
            <div className="pl-7 space-y-2">
              <div className="flex items-center space-x-3">
                <Checkbox 
                  id="statement-coverage" 
                  checked={testTypes.whitebox.statement}
                  onCheckedChange={(checked) => {
                    if (typeof checked === 'boolean') {
                      setTestTypes({
                        ...testTypes,
                        whitebox: {
                          ...testTypes.whitebox,
                          statement: checked
                        }
                      });
                    }
                  }}
                  disabled={!(testTypes.whitebox.statement || testTypes.whitebox.branch || testTypes.whitebox.path)}
                />
                <Label htmlFor="statement-coverage" className="text-sm text-neutral-600">
                  Statement Coverage
                </Label>
              </div>
              
              <div className="flex items-center space-x-3">
                <Checkbox 
                  id="branch-coverage" 
                  checked={testTypes.whitebox.branch}
                  onCheckedChange={(checked) => {
                    if (typeof checked === 'boolean') {
                      setTestTypes({
                        ...testTypes,
                        whitebox: {
                          ...testTypes.whitebox,
                          branch: checked
                        }
                      });
                    }
                  }}
                  disabled={!(testTypes.whitebox.statement || testTypes.whitebox.branch || testTypes.whitebox.path)}
                />
                <Label htmlFor="branch-coverage" className="text-sm text-neutral-600">
                  Branch Coverage
                </Label>
              </div>
              
              <div className="flex items-center space-x-3">
                <Checkbox 
                  id="path-coverage" 
                  checked={testTypes.whitebox.path}
                  onCheckedChange={(checked) => {
                    if (typeof checked === 'boolean') {
                      setTestTypes({
                        ...testTypes,
                        whitebox: {
                          ...testTypes.whitebox,
                          path: checked
                        }
                      });
                    }
                  }}
                  disabled={!(testTypes.whitebox.statement || testTypes.whitebox.branch || testTypes.whitebox.path)}
                />
                <Label htmlFor="path-coverage" className="text-sm text-neutral-600">
                  Path Coverage
                </Label>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Checkbox 
                id="blackbox" 
                checked={testTypes.blackbox.boundary || testTypes.blackbox.equivalence}
                onCheckedChange={handleBlackboxChange}
              />
              <div>
                <Label htmlFor="blackbox" className="text-sm font-medium text-neutral-800">
                  Blackbox Tests
                  <span className="text-neutral-500 ml-1">(spec-based)</span>
                </Label>
              </div>
            </div>
            
            <div className="pl-7 space-y-2">
              <div className="flex items-center space-x-3">
                <Checkbox 
                  id="boundary-analysis" 
                  checked={testTypes.blackbox.boundary}
                  onCheckedChange={(checked) => {
                    if (typeof checked === 'boolean') {
                      setTestTypes({
                        ...testTypes,
                        blackbox: {
                          ...testTypes.blackbox,
                          boundary: checked
                        }
                      });
                    }
                  }}
                  disabled={!(testTypes.blackbox.boundary || testTypes.blackbox.equivalence)}
                />
                <Label htmlFor="boundary-analysis" className="text-sm text-neutral-600">
                  Boundary Value Analysis
                </Label>
              </div>
              
              <div className="flex items-center space-x-3">
                <Checkbox 
                  id="equivalence-partitioning" 
                  checked={testTypes.blackbox.equivalence}
                  onCheckedChange={(checked) => {
                    if (typeof checked === 'boolean') {
                      setTestTypes({
                        ...testTypes,
                        blackbox: {
                          ...testTypes.blackbox,
                          equivalence: checked
                        }
                      });
                    }
                  }}
                  disabled={!(testTypes.blackbox.boundary || testTypes.blackbox.equivalence)}
                />
                <Label htmlFor="equivalence-partitioning" className="text-sm text-neutral-600">
                  Equivalence Partitioning
                </Label>
              </div>
            </div>
          </div>
        </div>
        
        <div>
          <h3 className="text-sm font-medium text-neutral-700 mb-3">API Configuration</h3>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="api-key" className="block text-sm font-medium text-neutral-700 mb-1">
                Grok API Key
              </Label>
              <Input
                type="password"
                id="api-key"
                className="w-full"
                placeholder="Enter your API key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
              <p className="mt-1 text-xs text-neutral-500">
                Your API key is securely stored in your browser's local storage only.
              </p>
            </div>
            
            <div>
              <Label htmlFor="model-type" className="block text-sm font-medium text-neutral-700 mb-1">
                Model Version
              </Label>
              <Select value={modelVersion} onValueChange={setModelVersion}>
                <SelectTrigger id="model-type" className="w-full">
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="grok-3">Grok 3</SelectItem>
                  <SelectItem value="grok-2">Grok 2</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="test-framework" className="block text-sm font-medium text-neutral-700 mb-1">
                Test Framework
              </Label>
              <Select value={testFramework} onValueChange={setTestFramework}>
                <SelectTrigger id="test-framework" className="w-full">
                  <SelectValue placeholder="Select framework" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="jest">Jest</SelectItem>
                  <SelectItem value="mocha">Mocha</SelectItem>
                  <SelectItem value="jasmine">Jasmine</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestSettings;
