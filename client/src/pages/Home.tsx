import { useEffect } from 'react';
import { useLocation } from 'wouter';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import WorkflowStepper from '@/components/WorkflowStepper';
import FileUploader from '@/components/FileUploader';
import SpecUploader from '@/components/SpecUploader';
import TestSettings from '@/components/TestSettings';
import { useAppState } from '@/hooks/useAppState';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

const Home = () => {
  const [, setLocation] = useLocation();
  const jsFiles = useAppState((state) => state.jsFiles);
  const specFile = useAppState((state) => state.specFile);
  const apiKey = useAppState((state) => state.apiKey);
  const setFunctions = useAppState((state) => state.setFunctions);
  const setSpecifications = useAppState((state) => state.setSpecifications);
  const { toast } = useToast();

  const handleContinue = async () => {
    if (jsFiles.length === 0) {
      toast({
        title: "No JavaScript files",
        description: "Please upload at least one JavaScript file",
        variant: "destructive",
      });
      return;
    }

    if (!apiKey) {
      toast({
        title: "API Key Required",
        description: "Please enter your Grok API key in the settings",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create FormData to upload files
      const formData = new FormData();
      jsFiles.forEach(file => formData.append('jsFiles', file));
      if (specFile) {
        formData.append('specFile', specFile);
      }

      // Upload files and analyze
      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Error analyzing code: ${response.statusText}`);
      }

      const data = await response.json();
      setFunctions(data.functions);
      setSpecifications(data.specifications);

      // Navigate to next step
      setLocation('/review');
    } catch (error) {
      console.error('Error analyzing code:', error);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to analyze code",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-6">
        <WorkflowStepper />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* JavaScript Files Upload */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="bg-primary-50 px-5 py-4 border-b border-primary-100">
              <h2 className="text-lg font-medium text-primary-700">
                <i className="ri-file-code-line mr-2 text-primary-500"></i>
                JavaScript Files
              </h2>
              <p className="text-sm text-neutral-600 mt-1">Upload .js or .ts files for test generation</p>
            </div>
            <FileUploader />
          </div>

          {/* Readme/Spec Upload */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="bg-primary-50 px-5 py-4 border-b border-primary-100">
              <h2 className="text-lg font-medium text-primary-700">
                <i className="ri-markdown-line mr-2 text-primary-500"></i>
                Project Specifications
              </h2>
              <p className="text-sm text-neutral-600 mt-1">Upload README.md or specification file</p>
            </div>
            <SpecUploader />
          </div>

          {/* API Configuration */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden md:col-span-2">
            <div className="bg-primary-50 px-5 py-4 border-b border-primary-100">
              <h2 className="text-lg font-medium text-primary-700">
                <i className="ri-settings-4-line mr-2 text-primary-500"></i>
                Test Generation Settings
              </h2>
              <p className="text-sm text-neutral-600 mt-1">Configure test generation options</p>
            </div>
            <TestSettings />
          </div>

          {/* Continue Button */}
          <div className="md:col-span-2 flex justify-end mt-2">
            <Button 
              className="bg-primary-500 hover:bg-primary-600 text-white font-medium px-6"
              onClick={handleContinue}
            >
              Continue to Review
              <i className="ri-arrow-right-line ml-1"></i>
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Home;
