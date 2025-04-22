import { useEffect } from 'react';
import { useLocation } from 'wouter';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import WorkflowStepper from '@/components/WorkflowStepper';
import ExtractedFunctions from '@/components/ExtractedFunctions';
import SpecificationMapping from '@/components/SpecificationMapping';
import { useAppState } from '@/hooks/useAppState';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

const CodeReview = () => {
  const [, setLocation] = useLocation();
  const setCurrentStep = useAppState((state) => state.setCurrentStep);
  const functions = useAppState((state) => state.functions);
  const specifications = useAppState((state) => state.specifications);
  const testTypes = useAppState((state) => state.testTypes);
  const apiKey = useAppState((state) => state.apiKey);
  const modelVersion = useAppState((state) => state.modelVersion);
  const testFramework = useAppState((state) => state.testFramework);
  const setFunctionTests = useAppState((state) => state.setFunctionTests);
  const { toast } = useToast();

  useEffect(() => {
    // Update the current step in app state
    setCurrentStep(2);

    // If no functions were analyzed, redirect back to home
    if (functions.length === 0) {
      setLocation('/');
    }
  }, [functions.length, setCurrentStep, setLocation]);

  const handleBack = () => {
    setLocation('/');
  };

  const handleGenerateTests = async () => {
    try {
      const response = await apiRequest('POST', '/api/tests/prepare', {
        functions,
        specifications,
        testTypes,
        config: {
          apiKey,
          modelVersion,
          testFramework
        }
      });

      setFunctionTests(response.functionTests);
      setLocation('/generate');
    } catch (error) {
      console.error('Error preparing test generation:', error);
      toast({
        title: "Preparation Failed",
        description: error instanceof Error ? error.message : "Failed to prepare test generation",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-6">
        <WorkflowStepper />
        
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <div className="bg-primary-50 px-5 py-4 border-b border-primary-100 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-medium text-primary-700">
                <i className="ri-file-search-line mr-2 text-primary-500"></i>
                Code Analysis
              </h2>
              <p className="text-sm text-neutral-600 mt-1">Review extracted functions and specifications</p>
            </div>
            <div className="text-sm">
              <span className="text-neutral-500">Files:</span>
              <span className="font-medium text-neutral-700 ml-1">{functions.reduce((acc, f) => {
                if (!acc.includes(f.fileName)) acc.push(f.fileName);
                return acc;
              }, [] as string[]).length}</span>
              <span className="mx-1 text-neutral-300">|</span>
              <span className="text-neutral-500">Functions:</span>
              <span className="font-medium text-neutral-700 ml-1">{functions.length}</span>
            </div>
          </div>
          
          <ExtractedFunctions />
          
          {specifications.length > 0 && <SpecificationMapping />}
        </div>
        
        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6">
          <Button 
            variant="outline"
            className="bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-50 font-medium px-6"
            onClick={handleBack}
          >
            <i className="ri-arrow-left-line mr-1"></i>
            Back to Upload
          </Button>
          
          <Button 
            className="bg-primary-500 hover:bg-primary-600 text-white font-medium px-6"
            onClick={handleGenerateTests}
            disabled={functions.length === 0}
          >
            Generate Tests
            <i className="ri-arrow-right-line ml-1"></i>
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CodeReview;
