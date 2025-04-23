function App() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-2xl font-bold text-blue-600 mb-4">TestGen</h1>
        <p className="text-gray-600 mb-6">LLM-Powered JavaScript Testing Tool</p>
        
        <div className="bg-blue-50 p-4 rounded-md border border-blue-200 mb-6">
          <p className="text-blue-700">
            Welcome to TestGen! This tool helps you automatically generate 
            comprehensive test cases for your JavaScript code using 
            the power of Grok AI.
          </p>
        </div>
        
        <div className="space-y-4">
          <button 
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded"
          >
            Get Started
          </button>
          
          <div className="text-center text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} TestGen
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
