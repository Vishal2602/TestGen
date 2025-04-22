import { useEffect } from 'react';
import { useLocation } from 'wouter';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import WorkflowStepper from '@/components/WorkflowStepper';
import TestResults from '@/components/TestResults';
import { useAppState } from '@/hooks/useAppState';
import { Button } from '@/components/ui/button';

const Results = () => {
  const [, setLocation] = useLocation();
  const setCurrentStep = useAppState((state) => state.setCurrentStep);
  const testFiles = useAppState((state) => state.testFiles);
  const cicdFiles = useAppState((state) => state.cicdFiles);
  const resetState = useAppState((state) => state.resetState);

  useEffect(() => {
    // Update the current step in app state
    setCurrentStep(4);

    // If no test files were generated, redirect back to generation
    if (testFiles.length === 0) {
      setLocation('/generate');
    }
  }, [testFiles, setCurrentStep, setLocation]);

  const handleBack = () => {
    setLocation('/generate');
  };

  const handleNewProject = () => {
    // Reset application state
    resetState();
    // Navigate to start
    setLocation('/');
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
                <i className="ri-file-list-3-line mr-2 text-primary-500"></i>
                Generated Test Files
              </h2>
              <p className="text-sm text-neutral-600 mt-1">Review and download your test cases</p>
            </div>
            <div>
              <Button className="bg-primary-500 hover:bg-primary-600 text-white text-sm">
                <i className="ri-download-cloud-line mr-1"></i>
                Download All
              </Button>
            </div>
          </div>
          
          <TestResults />
        </div>
        
        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6">
          <Button 
            variant="outline"
            className="bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-50 font-medium px-6"
            onClick={handleBack}
          >
            <i className="ri-arrow-left-line mr-1"></i>
            Back to Generation
          </Button>
          
          <Button 
            className="bg-success-500 hover:bg-success-600 text-white font-medium px-6"
            onClick={handleNewProject}
          >
            <i className="ri-check-line mr-1"></i>
            Complete Project
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Results;
