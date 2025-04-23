import { CoverageMetrics } from '@/lib/types';
import { Progress } from '@/components/ui/progress';
import { ChartBar, Gauge, ArrowBigUp, ZoomIn } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface CoverageDisplayProps {
  coverage?: CoverageMetrics;
  className?: string;
}

export function CoverageDisplay({ coverage, className = '' }: CoverageDisplayProps) {
  // If no coverage data is available, show a placeholder
  if (!coverage) {
    return (
      <div className={`p-4 rounded-lg bg-muted/30 ${className}`}>
        <div className="text-center text-muted-foreground">
          <Gauge className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No coverage data available</p>
        </div>
      </div>
    );
  }

  // Convert coverage percentages to display values, handling undefined values
  const statementCoverage = coverage.statementCoverage || 0;
  const branchCoverage = coverage.branchCoverage || 0;
  const pathCoverage = coverage.pathCoverage || 0;
  const boundaryValuesCovered = coverage.boundaryValuesCovered || 0;
  const edgeCasesCovered = coverage.edgeCasesCovered || 0;

  // Helper function to get color class based on coverage percentage
  const getColorClass = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Helper function to get progress color class
  const getProgressColorClass = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-600';
    if (percentage >= 60) return 'bg-yellow-600';
    return 'bg-red-600';
  };

  return (
    <div className={`p-4 rounded-lg bg-white border border-border ${className}`}>
      <h3 className="text-base font-medium mb-3 flex items-center">
        <Gauge className="h-5 w-5 mr-2 text-primary" />
        Test Coverage Metrics
      </h3>

      {/* Code Coverage Section */}
      <div className="space-y-3 mb-4">
        <div>
          <div className="flex justify-between items-center mb-1">
            <div className="text-sm flex items-center">
              <ChartBar className="h-4 w-4 mr-1 opacity-70" />
              Statement Coverage
            </div>
            <span className={`text-sm font-medium ${getColorClass(statementCoverage)}`}>
              {statementCoverage}%
            </span>
          </div>
          <Progress value={statementCoverage} className="h-2">
            <div className={`h-full ${getProgressColorClass(statementCoverage)}`} style={{ width: `${statementCoverage}%` }}></div>
          </Progress>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <div className="text-sm flex items-center">
              <ArrowBigUp className="h-4 w-4 mr-1 opacity-70" />
              Branch Coverage
            </div>
            <span className={`text-sm font-medium ${getColorClass(branchCoverage)}`}>
              {branchCoverage}%
            </span>
          </div>
          <Progress value={branchCoverage} className="h-2">
            <div className={`h-full ${getProgressColorClass(branchCoverage)}`} style={{ width: `${branchCoverage}%` }}></div>
          </Progress>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <div className="text-sm flex items-center">
              <ZoomIn className="h-4 w-4 mr-1 opacity-70" />
              Path Coverage
            </div>
            <span className={`text-sm font-medium ${getColorClass(pathCoverage)}`}>
              {pathCoverage}%
            </span>
          </div>
          <Progress value={pathCoverage} className="h-2">
            <div className={`h-full ${getProgressColorClass(pathCoverage)}`} style={{ width: `${pathCoverage}%` }}></div>
          </Progress>
        </div>
      </div>

      {/* Boundary and Edge Cases Section */}
      <div className="flex flex-wrap gap-2 mt-2">
        <div className="flex-1 min-w-[120px] bg-muted/30 p-2 rounded">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Boundary Values</div>
          <div className="text-xl font-semibold mt-1 flex items-center">
            {boundaryValuesCovered}
            <Badge variant="outline" className="ml-2 text-xs px-2 py-0 h-5">Covered</Badge>
          </div>
        </div>
        
        <div className="flex-1 min-w-[120px] bg-muted/30 p-2 rounded">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Edge Cases</div>
          <div className="text-xl font-semibold mt-1 flex items-center">
            {edgeCasesCovered}
            <Badge variant="outline" className="ml-2 text-xs px-2 py-0 h-5">Tested</Badge>
          </div>
        </div>
      </div>
    </div>
  );
}