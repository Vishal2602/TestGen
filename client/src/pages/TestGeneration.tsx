import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import WorkflowStepper from '@/components/WorkflowStepper';
import GenerationProgress from '@/components/GenerationProgress';
import { useAppState } from '@/hooks/useAppState';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

const TestGeneration = () => {
  const [, setLocation] = useLocation();
  const setCurrentStep = useAppState((state) => state.setCurrentStep);
  const functionTests = useAppState((state) => state.functionTests);
  const isGenerating = useAppState((state) => state.isGenerating);
  const setIsGenerating = useAppState((state) => state.setIsGenerating);
  const generationComplete = useAppState((state) => state.generationComplete);
  const setGenerationComplete = useAppState((state) => state.setGenerationComplete);
  const addApiLog = useAppState((state) => state.addApiLog);
  const updateFunctionTestStatus = useAppState((state) => state.updateFunctionTestStatus);
  const updateTestResult = useAppState((state) => state.updateTestResult);
  const setTestFiles = useAppState((state) => state.setTestFiles);
  const setCicdFiles = useAppState((state) => state.setCicdFiles);
  const { toast } = useToast();
  
  // WebSocket for real-time updates
  const [socket, setSocket] = useState<WebSocket | null>(null);

  useEffect(() => {
    // Update the current step in app state
    setCurrentStep(3);

    // If no function tests were prepared, redirect back to review
    if (functionTests.length === 0) {
      setLocation('/review');
      return;
    }

    // Setup WebSocket connection
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/ws/test-progress`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      addApiLog('[INFO] WebSocket connection established');
      setSocket(ws);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'log') {
        addApiLog(data.message);
      } else if (data.type === 'function_status') {
        updateFunctionTestStatus(data.functionName, data.status);
      } else if (data.type === 'test_result') {
        updateTestResult(
          data.functionName, 
          data.category, 
          data.status, 
          data.count
        );
      } else if (data.type === 'complete') {
        setGenerationComplete(true);
        setTestFiles(data.testFiles);
        setCicdFiles(data.cicdFiles);
        addApiLog('[INFO] Test generation completed');
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      addApiLog('[ERROR] WebSocket connection error');
    };

    ws.onclose = () => {
      addApiLog('[INFO] WebSocket connection closed');
    };

    setSocket(ws);

    return () => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [functionTests, setCurrentStep, setLocation, addApiLog, updateFunctionTestStatus, updateTestResult, setTestFiles, setCicdFiles, setGenerationComplete]);

  const handleBack = () => {
    setLocation('/review');
  };

  const handleStartGeneration = async () => {
    if (isGenerating) return;
    
    try {
      setIsGenerating(true);
      addApiLog('[INFO] Starting test generation process');
      
      // Start the test generation process
      await apiRequest('POST', '/api/tests/generate', {});
      
      // The rest is handled by the WebSocket connection
    } catch (error) {
      console.error('Error starting test generation:', error);
      setIsGenerating(false);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to start test generation",
        variant: "destructive",
      });
    }
  };

  const handleViewResults = () => {
    setLocation('/results');
  };

  // Auto-start generation when the component mounts
  useEffect(() => {
    if (!isGenerating && !generationComplete && functionTests.length > 0) {
      handleStartGeneration();
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-6">
        <WorkflowStepper />
        
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <div className="bg-primary-50 px-5 py-4 border-b border-primary-100">
            <h2 className="text-lg font-medium text-primary-700">
              <i className="ri-test-tube-line mr-2 text-primary-500"></i>
              Test Generation Progress
            </h2>
            <p className="text-sm text-neutral-600 mt-1">Creating test cases using Grok API</p>
          </div>
          
          <GenerationProgress />
        </div>
        
        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6">
          <Button 
            variant="outline"
            className="bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-50 font-medium px-6"
            onClick={handleBack}
            disabled={isGenerating && !generationComplete}
          >
            <i className="ri-arrow-left-line mr-1"></i>
            Back to Review
          </Button>
          
          <Button 
            className="bg-primary-500 hover:bg-primary-600 text-white font-medium px-6"
            onClick={handleViewResults}
            disabled={!generationComplete}
          >
            View Results
            <i className="ri-arrow-right-line ml-1"></i>
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TestGeneration;
