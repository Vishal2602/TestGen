import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { 
  AlertCircle, Code, FileText, Zap, Download, Loader2, Check,
  FileJson, Terminal, Github, Box, Cloud, Settings
} from 'lucide-react';
import { FileDropzone } from '@/components/FileDropzone';
import { FileCard } from '@/components/FileCard';
import { GeneratedTestFile } from '@/components/GeneratedTestFile';
import { CoverageDisplay } from '@/components/CoverageDisplay';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  UploadedFile,
  ProcessingStage,
  TestGenerationStatus,
  GeneratedTest,
  ExtractedFunction
} from '@/lib/types';
import { analyzeCode, generateTests, getTestGenerationStatus, downloadTestPackage, downloadAutomationFile } from '@/lib/grokApi';

export default function Home() {
  const { toast } = useToast();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [processingStage, setProcessingStage] = useState<ProcessingStage>(ProcessingStage.NotStarted);
  const [extractedFunctions, setExtractedFunctions] = useState<ExtractedFunction[]>([]);
  const [generatedTests, setGeneratedTests] = useState<GeneratedTest[]>([]);
  const [status, setStatus] = useState<TestGenerationStatus>({
    total: 0,
    completed: 0,
    inProgress: null,
    apiCalls: 0,
    estimatedTimeRemaining: ''
  });

  // Status polling
  const { data: statusData } = useQuery<TestGenerationStatus>({
    queryKey: ['/api/test-status'],
    enabled: processingStage === ProcessingStage.Generating,
    refetchInterval: 2000
  });

  useEffect(() => {
    if (statusData) {
      setStatus(prev => ({...prev, ...statusData}));
      if (statusData.completed === statusData.total && statusData.total > 0) {
        // When all tests are generated, fetch the final results
        const fetchResults = async () => {
          try {
            const response = await generateTests(files);
            setGeneratedTests(response.tests);
            setProcessingStage(ProcessingStage.Completed);
          } catch (error) {
            console.error('Error fetching final results:', error);
            setProcessingStage(ProcessingStage.Completed);
          }
        };
        
        fetchResults();
      }
    }
  }, [statusData, files]);

  // Check if we have at least one code file and one spec file
  const hasRequiredFiles = (): boolean => {
    const hasCodeFile = files.some(file => !file.isSpecFile);
    const hasSpecFile = files.some(file => file.isSpecFile);
    return hasCodeFile && hasSpecFile;
  };

  // File handlers
  const handleFilesAdded = (newFiles: UploadedFile[]) => {
    setFiles(prev => {
      // Filter out any duplicates by filename
      const existingNames = new Set(prev.map(f => f.name));
      const uniqueNewFiles = newFiles.filter(f => !existingNames.has(f.name));
      return [...prev, ...uniqueNewFiles];
    });
  };

  const handleRemoveFile = (id: string) => {
    setFiles(prev => prev.filter(file => file.id !== id));
  };

  // Analysis mutation
  const analysisMutation = useMutation({
    mutationFn: () => {
      setProcessingStage(ProcessingStage.Analyzing);
      return analyzeCode(files);
    },
    onSuccess: (data) => {
      setExtractedFunctions(data.functions);
      // Update file function counts
      setFiles(prev => 
        prev.map(file => {
          if (!file.isSpecFile) {
            const count = data.functions.filter(fn => fn.file === file.name).length;
            return { ...file, functionCount: count };
          }
          return file;
        })
      );
      setProcessingStage(ProcessingStage.Matching);
      
      // Start test generation immediately after analysis
      testGenerationMutation.mutate();
    },
    onError: (error) => {
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to analyze code",
        variant: "destructive"
      });
      setProcessingStage(ProcessingStage.Failed);
    }
  });

  // Test generation mutation
  const testGenerationMutation = useMutation({
    mutationFn: () => {
      setProcessingStage(ProcessingStage.Generating);
      return generateTests(files);
    },
    onSuccess: (data) => {
      // Don't set completed state here since we're waiting for the polling
      // to detect when all tests are generated
      setGeneratedTests(data.tests);
      setStatus(prev => ({...prev, ...data.status}));
      
      // Don't set the completed state here, let the statusData useEffect handle it
      // when all tests are actually generated
    },
    onError: (error) => {
      toast({
        title: "Test Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate tests",
        variant: "destructive"
      });
      setProcessingStage(ProcessingStage.Failed);
    }
  });

  // Download test package mutation
  const downloadMutation = useMutation({
    mutationFn: downloadTestPackage,
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'test-package.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Download Complete",
        description: "Test package has been downloaded successfully"
      });
    },
    onError: (error) => {
      toast({
        title: "Download Failed",
        description: error instanceof Error ? error.message : "Failed to download test package",
        variant: "destructive"
      });
    }
  });
  
  // Automation file download mutation
  const automationMutation = useMutation({
    mutationFn: (type: 'package_json' | 'shell_script' | 'github_actions' | 'dockerfile') => {
      return downloadAutomationFile(type, 'test-runner', '18');
    },
    onSuccess: (blob, type) => {
      // Define filename based on type
      let filename = 'automation-file';
      switch (type) {
        case 'package_json': 
          filename = 'package.json'; 
          break;
        case 'shell_script': 
          filename = 'run-tests.sh'; 
          break;
        case 'github_actions': 
          filename = 'github-workflow.yml'; 
          break;
        case 'dockerfile': 
          filename = 'Dockerfile'; 
          break;
      }
      
      // Download the file
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      // Show success message
      toast({
        title: "Automation File Downloaded",
        description: `${filename} has been downloaded successfully`
      });
    },
    onError: (error) => {
      toast({
        title: "Download Failed",
        description: error instanceof Error ? error.message : "Failed to download automation file",
        variant: "destructive"
      });
    }
  });
  
  // Handle downloading automation files
  const handleDownloadAutomation = (type: 'package_json' | 'shell_script' | 'github_actions' | 'dockerfile') => {
    automationMutation.mutate(type);
  };

  // Start processing
  const handleStartProcessing = () => {
    if (!hasRequiredFiles()) {
      toast({
        title: "Missing Files",
        description: "You need at least one code file and one specification file",
        variant: "destructive"
      });
      return;
    }
    
    analysisMutation.mutate();
  };

  const isProcessing = 
    processingStage === ProcessingStage.Analyzing || 
    processingStage === ProcessingStage.Matching || 
    processingStage === ProcessingStage.Generating;

  return (
    <div className="flex flex-col space-y-8 container mx-auto px-4 py-8">
      {/* Introduction Section */}
      <section>
        <div className="bg-white rounded-lg shadow-sm p-6 border border-border">
          <h2 className="text-lg font-semibold mb-4">LLM-Powered Software Testing Tool</h2>
          <p className="text-muted-foreground mb-4">
            Upload JavaScript/TypeScript files and a README.md with specifications to automatically generate comprehensive test cases using Grok 3 API.
          </p>
          <div className="flex flex-wrap gap-4">
            <div className="bg-muted/30 p-3 rounded-lg flex items-center space-x-3 flex-grow basis-44">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">Parse Code</h3>
                <p className="text-sm text-muted-foreground">Extract functions, classes, and modules</p>
              </div>
            </div>
            <div className="bg-muted/30 p-3 rounded-lg flex items-center space-x-3 flex-grow basis-44">
              <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
                <Code className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <h3 className="font-medium">Match Specs</h3>
                <p className="text-sm text-muted-foreground">Connect code with specifications</p>
              </div>
            </div>
            <div className="bg-muted/30 p-3 rounded-lg flex items-center space-x-3 flex-grow basis-44">
              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                <Zap className="h-5 w-5 text-accent" />
              </div>
              <div>
                <h3 className="font-medium">Generate Tests</h3>
                <p className="text-sm text-muted-foreground">Create whitebox & blackbox tests</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* File Upload Section */}
      <section>
        <div className="bg-white rounded-lg shadow-sm p-6 border border-border">
          <h2 className="text-lg font-semibold mb-4">Upload Files</h2>
          
          <FileDropzone onFilesAdded={handleFilesAdded} />

          {/* Uploaded Files Section */}
          <div className="border-t border-border pt-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-medium">Uploaded Files</h3>
              <Button 
                disabled={!hasRequiredFiles() || isProcessing} 
                onClick={handleStartProcessing}
              >
                {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Generate Tests
              </Button>
            </div>
            
            {files.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {files.map(file => (
                  <FileCard key={file.id} file={file} onRemove={handleRemoveFile} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-muted/30 rounded-lg border border-dashed border-border">
                <AlertCircle className="mx-auto h-10 w-10 text-muted-foreground" />
                <p className="mt-2 text-muted-foreground">No files uploaded yet</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Processing Section */}
      {(processingStage !== ProcessingStage.NotStarted && processingStage !== ProcessingStage.Completed) && (
        <section className="bg-white rounded-lg shadow-sm p-6 border border-border">
          <h2 className="text-lg font-semibold mb-4">Analysis & Test Generation</h2>
          
          {/* Processing Steps */}
          <div className="space-y-4 mb-6">
            {/* Step 1: Code Analysis */}
            <div className="flex items-start">
              <div className="mr-4 flex-shrink-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  processingStage === ProcessingStage.Analyzing 
                    ? 'bg-blue-100' 
                    : processingStage > ProcessingStage.Analyzing 
                      ? 'bg-green-100' 
                      : 'bg-muted'
                }`}>
                  {processingStage === ProcessingStage.Analyzing ? (
                    <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                  ) : processingStage > ProcessingStage.Analyzing ? (
                    <Check className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-base font-medium">Code Analysis</h3>
                {processingStage > ProcessingStage.Analyzing ? (
                  <p className="text-sm text-muted-foreground">
                    Extracted {extractedFunctions.length} functions from {files.filter(f => !f.isSpecFile).length} files
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">Extracting functions, classes, and modules...</p>
                )}
              </div>
            </div>
            
            {/* Step 2: Specification Matching */}
            <div className="flex items-start">
              <div className="mr-4 flex-shrink-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  processingStage === ProcessingStage.Matching 
                    ? 'bg-blue-100' 
                    : processingStage > ProcessingStage.Matching 
                      ? 'bg-green-100' 
                      : 'bg-muted'
                }`}>
                  {processingStage === ProcessingStage.Matching ? (
                    <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                  ) : processingStage > ProcessingStage.Matching ? (
                    <Check className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-base font-medium">Specification Matching</h3>
                {processingStage > ProcessingStage.Matching ? (
                  <p className="text-sm text-muted-foreground">
                    Matched {extractedFunctions.filter(f => f.hasSpec).length} functions with specifications
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">Matching functions with specifications...</p>
                )}
              </div>
            </div>
            
            {/* Step 3: Test Generation */}
            <div className="flex items-start">
              <div className="mr-4 flex-shrink-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  processingStage === ProcessingStage.Generating 
                    ? 'bg-blue-100' 
                    : processingStage > ProcessingStage.Generating 
                      ? 'bg-green-100' 
                      : 'bg-muted'
                }`}>
                  {processingStage === ProcessingStage.Generating ? (
                    <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                  ) : processingStage > ProcessingStage.Generating ? (
                    <Check className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-base font-medium">Test Generation</h3>
                {processingStage === ProcessingStage.Generating && (
                  <>
                    <p className="text-sm text-muted-foreground">
                      Generating tests using Grok 3 API ({status.completed}/{status.total} completed)
                    </p>
                    <Progress 
                      className="mt-2" 
                      value={status.total > 0 ? (status.completed / status.total) * 100 : 0} 
                    />
                  </>
                )}
                {processingStage > ProcessingStage.Generating && (
                  <p className="text-sm text-muted-foreground">
                    Generated {generatedTests.length} test files successfully
                  </p>
                )}
                {processingStage < ProcessingStage.Generating && (
                  <p className="text-sm text-muted-foreground">Waiting to generate tests...</p>
                )}
              </div>
            </div>
          </div>
          
          {/* Currently Processing */}
          {processingStage === ProcessingStage.Generating && status.inProgress && (
            <div className="bg-muted/30 rounded-lg p-4 mb-6">
              <h3 className="text-sm font-medium text-foreground mb-2">Currently Processing</h3>
              <div className="flex items-center">
                <Code className="h-5 w-5 text-secondary mr-2" />
                <div className="flex-1">
                  <div className="text-sm font-medium">{status.inProgress}</div>
                  <div className="text-xs text-muted-foreground">Generating whitebox and blackbox tests</div>
                </div>
                <div className="w-24 h-1 bg-muted relative overflow-hidden rounded">
                  <div className="h-full bg-primary absolute left-0 w-1/3 animate-[loading_2s_linear_infinite]"></div>
                </div>
              </div>
            </div>
          )}
          
          {/* API Call Stats */}
          {processingStage === ProcessingStage.Generating && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-muted/30 rounded-lg p-4 text-center">
                <div className="text-2xl font-semibold">{status.completed}/{status.total}</div>
                <div className="text-sm text-muted-foreground">Functions Processed</div>
              </div>
              <div className="bg-muted/30 rounded-lg p-4 text-center">
                <div className="text-2xl font-semibold">{status.apiCalls}</div>
                <div className="text-sm text-muted-foreground">API Calls Made</div>
              </div>
              <div className="bg-muted/30 rounded-lg p-4 text-center">
                <div className="text-2xl font-semibold">{status.estimatedTimeRemaining}</div>
                <div className="text-sm text-muted-foreground">Est. Time Remaining</div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Results Section */}
      {processingStage === ProcessingStage.Completed && generatedTests.length > 0 && (
        <section className="bg-white rounded-lg shadow-sm p-6 border border-border">
          <h2 className="text-lg font-semibold mb-4">Generated Tests</h2>
          
          <Tabs defaultValue="testFiles">
            <TabsList className="mb-4">
              <TabsTrigger value="testFiles">Test Files</TabsTrigger>
              <TabsTrigger value="coverage">Coverage</TabsTrigger>
              <TabsTrigger value="summary">Summary</TabsTrigger>
            </TabsList>
            
            <TabsContent value="testFiles" className="space-y-4">
              {generatedTests.map(test => (
                <GeneratedTestFile key={test.id} test={test} />
              ))}
            </TabsContent>
            
            <TabsContent value="coverage">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {generatedTests.some(test => test.coverage) ? (
                  generatedTests.map(test => (
                    <div key={test.id} className="bg-white rounded-lg border border-border overflow-hidden">
                      <div className="bg-muted/30 p-3">
                        <h3 className="font-medium">{test.functionName}</h3>
                        <p className="text-xs text-muted-foreground">{test.fileName}</p>
                      </div>
                      <CoverageDisplay coverage={test.coverage} className="p-4" />
                    </div>
                  ))
                ) : (
                  <div className="p-4 bg-muted/30 rounded-lg text-center col-span-full">
                    <p className="text-muted-foreground">
                      No coverage data available for the generated tests
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="summary">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-muted/30 rounded-lg">
                  <h3 className="font-medium mb-2">Test Generation Summary</h3>
                  <ul className="space-y-2 text-sm">
                    <li>Total functions analyzed: {extractedFunctions.length}</li>
                    <li>Functions with specifications: {extractedFunctions.filter(f => f.hasSpec).length}</li>
                    <li>Test files generated: {generatedTests.length}</li>
                    <li>Total test cases: {generatedTests.reduce((sum, test) => sum + test.testCount, 0)}</li>
                    <li>API calls made: {status.apiCalls}</li>
                  </ul>
                </div>

                {generatedTests.some(test => test.coverage) && (
                  <div className="p-4 bg-white rounded-lg border border-border">
                    <h3 className="font-medium mb-4">Average Coverage Metrics</h3>
                    <CoverageDisplay 
                      coverage={{
                        statementCoverage: Math.round(generatedTests.reduce((sum, test) => 
                          sum + (test.coverage?.statementCoverage || 0), 0) / generatedTests.length),
                        branchCoverage: Math.round(generatedTests.reduce((sum, test) => 
                          sum + (test.coverage?.branchCoverage || 0), 0) / generatedTests.length),
                        pathCoverage: Math.round(generatedTests.reduce((sum, test) => 
                          sum + (test.coverage?.pathCoverage || 0), 0) / generatedTests.length),
                        boundaryValuesCovered: generatedTests.reduce((sum, test) => 
                          sum + (test.coverage?.boundaryValuesCovered || 0), 0),
                        edgeCasesCovered: generatedTests.reduce((sum, test) => 
                          sum + (test.coverage?.edgeCasesCovered || 0), 0)
                      }} 
                    />
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
          
          {/* Download Options */}
          <div className="mt-6 space-y-4">
            <h3 className="font-medium">Download Options</h3>
            
            {/* Test Package */}
            <div className="bg-muted/30 p-4 rounded-lg">
              <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <div>
                  <h4 className="font-medium">Complete Test Package</h4>
                  <p className="text-sm text-muted-foreground">Includes all test files and configuration for Jest</p>
                </div>
                <Button 
                  className="md:self-end"
                  onClick={() => downloadMutation.mutate()}
                  disabled={downloadMutation.isPending}
                >
                  {downloadMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  Download Package
                </Button>
              </div>
            </div>
            
            {/* Automation Files */}
            <div className="bg-muted/30 p-4 rounded-lg">
              <div className="mb-4">
                <h4 className="font-medium">Automation Files</h4>
                <p className="text-sm text-muted-foreground">Generate files for test automation in different environments</p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="border border-border rounded-lg p-3 bg-white">
                  <div className="flex items-center gap-2 mb-2">
                    <FileJson className="h-5 w-5 text-blue-500" />
                    <h5 className="font-medium">package.json</h5>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    Jest configuration for running tests locally with npm
                  </p>
                  <Button 
                    size="sm" 
                    className="w-full"
                    variant="outline"
                    onClick={() => handleDownloadAutomation('package_json')}
                    disabled={automationMutation.isPending}
                  >
                    {automationMutation.isPending && automationMutation.variables === 'package_json' ? (
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    ) : (
                      <Download className="mr-2 h-3 w-3" />
                    )}
                    Download
                  </Button>
                </div>
                
                <div className="border border-border rounded-lg p-3 bg-white">
                  <div className="flex items-center gap-2 mb-2">
                    <Terminal className="h-5 w-5 text-green-500" />
                    <h5 className="font-medium">Shell Script</h5>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    Bash script to install dependencies and run tests
                  </p>
                  <Button 
                    size="sm" 
                    className="w-full"
                    variant="outline"
                    onClick={() => handleDownloadAutomation('shell_script')}
                    disabled={automationMutation.isPending}
                  >
                    {automationMutation.isPending && automationMutation.variables === 'shell_script' ? (
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    ) : (
                      <Download className="mr-2 h-3 w-3" />
                    )}
                    Download
                  </Button>
                </div>
                
                <div className="border border-border rounded-lg p-3 bg-white">
                  <div className="flex items-center gap-2 mb-2">
                    <Github className="h-5 w-5 text-slate-700" />
                    <h5 className="font-medium">GitHub Actions</h5>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    Workflow file for GitHub Actions CI pipeline
                  </p>
                  <Button 
                    size="sm" 
                    className="w-full"
                    variant="outline"
                    onClick={() => handleDownloadAutomation('github_actions')}
                    disabled={automationMutation.isPending}
                  >
                    {automationMutation.isPending && automationMutation.variables === 'github_actions' ? (
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    ) : (
                      <Download className="mr-2 h-3 w-3" />
                    )}
                    Download
                  </Button>
                </div>
                
                <div className="border border-border rounded-lg p-3 bg-white">
                  <div className="flex items-center gap-2 mb-2">
                    <Box className="h-5 w-5 text-blue-600" />
                    <h5 className="font-medium">Dockerfile</h5>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    Docker configuration to run tests in containers
                  </p>
                  <Button 
                    size="sm" 
                    className="w-full"
                    variant="outline"
                    onClick={() => handleDownloadAutomation('dockerfile')}
                    disabled={automationMutation.isPending}
                  >
                    {automationMutation.isPending && automationMutation.variables === 'dockerfile' ? (
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    ) : (
                      <Download className="mr-2 h-3 w-3" />
                    )}
                    Download
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
