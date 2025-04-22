import { useAppState } from '@/hooks/useAppState';
import { getConfidenceBadgeColor, getConfidenceLabel } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const SpecificationMapping = () => {
  const specifications = useAppState((state) => state.specifications);
  const functions = useAppState((state) => state.functions);
  const updateSpecificationMapping = useAppState((state) => state.updateSpecificationMapping);

  return (
    <div className="border-t border-neutral-100 p-5">
      <div className="mb-4">
        <h3 className="text-sm font-medium text-neutral-700">Specification Mapping</h3>
        <p className="text-xs text-neutral-500 mt-1">
          Match specifications to functions for more accurate test generation
        </p>
      </div>
      
      <div className="border rounded-lg overflow-hidden">
        {/* Mapping table */}
        <div className="bg-neutral-50 px-4 py-2 grid grid-cols-10 gap-4 border-b text-xs font-medium text-neutral-600">
          <div className="col-span-4">Specification</div>
          <div className="col-span-4">Mapped Function</div>
          <div className="col-span-2 text-right">Confidence</div>
        </div>
        
        <div className="max-h-64 overflow-y-auto">
          {specifications.length === 0 ? (
            <div className="px-4 py-8 text-center text-neutral-500">
              No specifications extracted yet. Please upload a README.md or specification file.
            </div>
          ) : (
            specifications.map((spec, index) => (
              <div key={index} className="px-4 py-3 grid grid-cols-10 gap-4 border-b text-sm hover:bg-neutral-50">
                <div className="col-span-4 text-neutral-700">{spec.description}</div>
                <div className="col-span-4">
                  <Select 
                    value={spec.mappedFunction || ''} 
                    onValueChange={(value) => updateSpecificationMapping(index, value)}
                  >
                    <SelectTrigger className="w-full text-sm">
                      <SelectValue placeholder="Select function" />
                    </SelectTrigger>
                    <SelectContent>
                      {functions.map((func) => (
                        <SelectItem key={func.name} value={func.name}>
                          {func.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 text-right">
                  {spec.confidence !== undefined && (
                    <span className={`text-xs px-2 py-0.5 rounded ${getConfidenceBadgeColor(spec.confidence)}`}>
                      {getConfidenceLabel(spec.confidence)} ({spec.confidence}%)
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default SpecificationMapping;
