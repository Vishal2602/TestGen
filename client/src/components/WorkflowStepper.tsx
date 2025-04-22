import { useAppState } from '@/hooks/useAppState';
import { cn } from '@/lib/utils';
import { AppStep } from '@/lib/types';

const WorkflowStepper = () => {
  const currentStep = useAppState((state) => state.currentStep);
  const setCurrentStep = useAppState((state) => state.setCurrentStep);

  const steps = [
    { number: 1 as AppStep, label: 'Upload Files', icon: 'ri-upload-2-line' },
    { number: 2 as AppStep, label: 'Review Code', icon: 'ri-file-search-line' },
    { number: 3 as AppStep, label: 'Generate Tests', icon: 'ri-test-tube-line' },
    { number: 4 as AppStep, label: 'Results', icon: 'ri-download-line' }
  ];

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between max-w-3xl mx-auto">
        {steps.map((step, index) => (
          <React.Fragment key={step.number}>
            <div className="flex flex-col items-center" data-step={step.number}>
              <div 
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center",
                  currentStep >= step.number 
                    ? "bg-primary-500 text-white" 
                    : "bg-neutral-200 text-neutral-500"
                )}
                onClick={() => {
                  // Only allow going back to previous steps
                  if (step.number < currentStep) {
                    setCurrentStep(step.number);
                  }
                }}
              >
                <i className={step.icon}></i>
              </div>
              <span 
                className={cn(
                  "text-sm mt-2 font-medium",
                  currentStep >= step.number 
                    ? "text-neutral-900" 
                    : "text-neutral-500"
                )}
              >
                {step.label}
              </span>
            </div>
            
            {index < steps.length - 1 && (
              <div 
                className={cn(
                  "h-1 w-full mx-2",
                  currentStep > index + 1 
                    ? "bg-primary-200" 
                    : "bg-neutral-200"
                )}
              ></div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default WorkflowStepper;
