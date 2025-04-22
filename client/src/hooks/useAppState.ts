import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppState, AppStep } from '@/lib/types';
import { TestTypes, testStatusSchema } from '@shared/schema';

const defaultTestTypes: TestTypes = {
  whitebox: {
    statement: true,
    branch: true,
    path: false,
  },
  blackbox: {
    boundary: true,
    equivalence: true,
  }
};

export const useAppState = create<AppState>()(
  persist(
    (set) => ({
      currentStep: 1 as AppStep,
      jsFiles: [],
      specFile: null,
      functions: [],
      specifications: [],
      testTypes: defaultTestTypes,
      apiKey: '',
      modelVersion: 'grok-3',
      testFramework: 'jest',
      functionTests: [],
      testFiles: [],
      cicdFiles: [],
      apiLogs: [],
      isGenerating: false,
      generationComplete: false,

      // Actions
      setCurrentStep: (step: AppStep) => set({ currentStep: step }),
      
      addJsFiles: (files: File[]) => set((state) => ({
        jsFiles: [...state.jsFiles, ...files]
      })),
      
      removeJsFile: (fileName: string) => set((state) => ({
        jsFiles: state.jsFiles.filter(file => file.name !== fileName)
      })),
      
      setSpecFile: (file: File | null) => set({ specFile: file }),
      
      setFunctions: (functions) => set({ functions }),
      
      setSpecifications: (specifications) => set({ specifications }),
      
      updateSpecificationMapping: (index: number, functionName: string) => set((state) => ({
        specifications: state.specifications.map((spec, i) => 
          i === index ? { ...spec, mappedFunction: functionName } : spec
        )
      })),
      
      setTestTypes: (testTypes) => set({ testTypes }),
      
      setApiKey: (apiKey) => set({ apiKey }),
      
      setModelVersion: (modelVersion) => set({ modelVersion }),
      
      setTestFramework: (testFramework) => set({ testFramework }),
      
      setFunctionTests: (functionTests) => set({ functionTests }),
      
      updateFunctionTestStatus: (functionName: string, status) => set((state) => ({
        functionTests: state.functionTests.map(test => 
          test.functionName === functionName ? { ...test, status } : test
        )
      })),
      
      updateTestResult: (functionName: string, category, status, count) => set((state) => ({
        functionTests: state.functionTests.map(test => 
          test.functionName === functionName ? {
            ...test,
            results: test.results.map(result => 
              result.category === category ? { ...result, status, count } : result
            )
          } : test
        )
      })),
      
      setTestFiles: (testFiles) => set({ testFiles }),
      
      setCicdFiles: (cicdFiles) => set({ cicdFiles }),
      
      addApiLog: (log: string) => set((state) => ({
        apiLogs: [...state.apiLogs, log]
      })),
      
      setIsGenerating: (isGenerating) => set({ isGenerating }),
      
      setGenerationComplete: (generationComplete) => set({ generationComplete }),
      
      resetState: () => set({
        currentStep: 1,
        jsFiles: [],
        specFile: null,
        functions: [],
        specifications: [],
        testTypes: defaultTestTypes,
        functionTests: [],
        testFiles: [],
        cicdFiles: [],
        apiLogs: [],
        isGenerating: false,
        generationComplete: false
      })
    }),
    {
      name: 'test-gen-storage',
      partialize: (state) => ({
        apiKey: state.apiKey,
        modelVersion: state.modelVersion,
        testFramework: state.testFramework,
        testTypes: state.testTypes
      }),
    }
  )
);
