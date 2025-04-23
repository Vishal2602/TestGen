# TestGen - LLM-Powered Test Generator

TestGen is an intelligent test generation tool that leverages Large Language Models to automatically analyze your code and generate comprehensive test suites. It uses the Grok 3 API to create both whitebox and blackbox tests for JavaScript/TypeScript functions.

## Features

- **Automatic Code Analysis**: Upload or paste your code to be analyzed for testable functions
- **LLM-Powered Test Generation**: Generate high-quality test cases using AI
- **Real-time Status Updates**: Monitor test generation progress
- **Modern UI**: Clean, responsive interface built with React and TailwindCSS
- **Specification Matching**: Connect code with documentation to create more accurate tests
- **Test Packaging**: Download generated tests as a complete package with Jest configuration
- **Coverage Metrics**: View detailed test coverage statistics for generated tests

## Application Architecture

### Overview
TestGen follows a client-server architecture with a clear separation between the React frontend and Express.js backend:

- **Frontend**: Single-page application built with React and TypeScript
- **Backend**: Express.js server providing REST API endpoints
- **Storage**: File-based storage system for code, functions, and tests
- **Code Analysis**: Uses esprima to parse and extract functions from JavaScript/TypeScript
- **Test Generation**: Utilizes LLM capabilities through the Grok 3 API

### Application Flow
1. User uploads code files (.js, .ts, .jsx, .tsx) and specification files (typically README.md)
2. Backend analyzes code and extracts testable functions using esprima
3. Specifications are matched to functions where possible for context-aware test generation
4. Test generation is queued and processed asynchronously with real-time progress updates
5. Generated tests include both whitebox and blackbox methodologies for comprehensive coverage
6. Tests can be viewed in the UI or downloaded as a package with proper Jest configuration

## Tech Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight alternative to React Router)
- **State Management**: React Query for server state, React hooks for local state
- **UI Components**: Radix UI primitives for accessible, composable components
- **Styling**: TailwindCSS with custom configuration
- **Form Handling**: React Hook Form with Zod validation

### Backend
- **Framework**: Express.js with TypeScript
- **Code Parsing**: Esprima for JavaScript/TypeScript AST generation
- **File Handling**: Archiver for creating downloadable zip packages
- **Type Safety**: TypeScript and Zod for runtime validation
- **API Client**: OpenAI/Grok API integration for LLM-powered test generation

## Getting Started

### Prerequisites

- Node.js (v16+)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/TestGen.git
   cd TestGen
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the application:
   ```bash
   npm run build
   ```

4. Start the server:
   ```bash
   npm start
   ```

The application will be available at http://localhost:3000

### Development Mode

To run the application in development mode with hot reloading:

```bash
npm run dev
```

## Usage

1. Visit http://localhost:3000 in your browser
2. Upload or paste your code into the editor
3. Click "Analyze" to identify testable functions
4. Click "Generate Tests" to create test cases
5. Monitor the test generation progress
6. View and download the generated tests

## Key Components

### Frontend Components
- **FileDropzone**: Handles file uploads with drag-and-drop capability
- **FileCard**: Displays uploaded files with metadata and function count
- **GeneratedTestFile**: Shows generated test code with syntax highlighting
- **CoverageDisplay**: Visualizes test coverage metrics with interactive charts
- **ProcessingStatus**: Provides real-time updates on test generation progress

### Backend Services
- **codeAnalyzer**: Extracts functions and methods from source code
- **testGenerator**: Generates test cases using LLM with prioritized queue system
- **grokService**: Handles API interactions with the LLM provider
- **storage**: Manages persistence of code files, functions, and generated tests

## API Endpoints

- `POST /api/analyze`: Analyze code files and identify testable functions
  - Request: Array of code files with content
  - Response: Extracted functions with metadata

- `POST /api/generate-tests`: Generate test cases for analyzed functions
  - Request: Array of code files with content
  - Response: Initial test generation status

- `GET /api/test-status`: Check the status of test generation
  - Response: Current progress with estimated time remaining

- `GET /api/download-tests`: Download generated tests as a package
  - Response: ZIP file containing tests with Jest configuration

## Configuration

The application can be configured through environment variables:

- `NODE_ENV`: Set to `production` for production mode, `development` for development mode
- `PORT`: Server port (default: 3000)
- `GROK_API_KEY`: Your API key for the Grok service (if using Grok)

## Implementation Details

### Code Analysis Process
1. Parse code using esprima to generate AST (Abstract Syntax Tree)
2. Traverse AST to identify functions, arrow functions, methods, and exported functions
3. Extract function signatures, parameters, and code blocks
4. Match functions with specifications from documentation where possible

### Test Generation Process
1. Queue functions for test generation with priority for functions with specifications
2. Use LLM to generate appropriate test cases based on function code and specifications
3. Create both whitebox (implementation-aware) and blackbox (specification-based) tests
4. Calculate estimated coverage metrics for the generated tests
5. Format tests following Jest conventions with proper imports and setup

## License

This project is licensed under the MIT License - see the LICENSE file for details. 