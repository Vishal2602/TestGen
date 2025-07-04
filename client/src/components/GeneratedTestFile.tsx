import { useState } from 'react';
import { Check, Copy, Download, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GeneratedTest } from '@/lib/types';
import { CoverageDisplay } from '@/components/CoverageDisplay';

interface GeneratedTestFileProps {
  test: GeneratedTest;
}

export function GeneratedTestFile({ test }: GeneratedTestFileProps) {
  const [isCopied, setIsCopied] = useState(false);
  const [showCoverage, setShowCoverage] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(test.testCode);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([test.testCode], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = test.testFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const toggleCoverage = () => {
    setShowCoverage(!showCoverage);
  };

  return (
    <Card className="border border-border overflow-hidden">
      <div className="bg-muted/30 p-3 flex justify-between items-center">
        <div className="font-medium">{test.testFileName}</div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            className="h-8"
            onClick={handleCopy}
          >
            {isCopied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
            {isCopied ? 'Copied' : 'Copy'}
          </Button>
          <Button 
            size="sm"
            className="h-8"
            onClick={handleDownload}
          >
            <Download className="h-4 w-4 mr-1" />
            Download
          </Button>
        </div>
      </div>
      <div className="p-4 bg-[#2d2d2d] max-h-96 overflow-y-auto">
        <pre className="text-sm text-white font-mono whitespace-pre-wrap">{test.testCode}</pre>
      </div>
      <CardContent className="p-3 flex justify-between items-center text-sm text-muted-foreground border-t border-border">
        <div className="flex items-center">
          <span>Generated {test.types.join(' and ')} tests</span>
          <span className="mx-2">•</span>
          <span>{test.testCount} test cases</span>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-7 px-2"
          onClick={toggleCoverage}
        >
          <span className="mr-1">Coverage</span>
          {showCoverage ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </CardContent>
      
      {showCoverage && (
        <div className="border-t border-border">
          <CoverageDisplay coverage={test.coverage} className="p-4" />
        </div>
      )}
    </Card>
  );
}
