import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

function App() {
  const [apiKey, setApiKey] = useState<string>("");
  const [jsFile, setJsFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setJsFile(selectedFile);
      setFileName(selectedFile.name);
    }
  };

  const handleSubmit = () => {
    if (!apiKey) {
      toast({
        title: "API Key Required",
        description: "Please enter your Grok API key to continue",
        variant: "destructive",
      });
      return;
    }

    if (!jsFile) {
      toast({
        title: "File Required",
        description: "Please upload a JavaScript file to analyze",
        variant: "destructive",
      });
      return;
    }

    // Show success toast
    toast({
      title: "Success!",
      description: `Ready to analyze ${fileName} with the provided API key`,
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 py-4">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl font-bold text-primary-700">TestGen</h1>
          <p className="text-slate-500">LLM-Powered JavaScript Testing Tool</p>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto">
          <h2 className="text-xl font-semibold mb-6 text-slate-800">Getting Started</h2>
          
          <div className="space-y-6">
            <div>
              <label htmlFor="api-key" className="block text-sm font-medium text-slate-700 mb-1">
                Grok API Key
              </label>
              <Input
                type="password"
                id="api-key"
                placeholder="Enter your API key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full"
              />
              <p className="mt-1 text-xs text-slate-500">
                Your API key is stored locally and never shared.
              </p>
            </div>

            <div>
              <label htmlFor="js-file" className="block text-sm font-medium text-slate-700 mb-1">
                JavaScript File
              </label>
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center">
                {fileName ? (
                  <div className="flex items-center justify-center">
                    <span className="text-primary-600 font-medium">{fileName}</span>
                    <button 
                      className="ml-2 text-slate-400 hover:text-error-500"
                      onClick={() => {
                        setJsFile(null);
                        setFileName("");
                      }}
                    >
                      <i className="ri-delete-bin-line"></i>
                    </button>
                  </div>
                ) : (
                  <>
                    <p className="text-slate-600 mb-2">Drag and drop a JavaScript file or</p>
                    <label 
                      htmlFor="file-upload" 
                      className="bg-primary-500 hover:bg-primary-600 text-white rounded px-4 py-2 text-sm cursor-pointer"
                    >
                      Browse Files
                    </label>
                  </>
                )}
                <input 
                  id="file-upload" 
                  type="file" 
                  className="hidden"
                  accept=".js,.jsx,.ts,.tsx"
                  onChange={handleFileChange}
                />
              </div>
            </div>

            <Button 
              className="w-full bg-primary-500 hover:bg-primary-600 text-white font-medium"
              onClick={handleSubmit}
            >
              Continue
            </Button>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-slate-200 py-4">
        <div className="container mx-auto px-4">
          <p className="text-center text-slate-500 text-sm">
            Powered by Grok API &copy; {new Date().getFullYear()}
          </p>
        </div>
      </footer>
      
      <Toaster />
    </div>
  );
}

export default App;
