/**
 * Service for generating test automation files
 * This service creates different types of automation files (package.json, CI config, etc.)
 * to help users run the generated tests
 */

import { TestFile } from '@shared/schema';
import { AutomationType } from '@shared/schema';
import * as fs from 'fs';
import * as path from 'path';

interface AutomationFileOptions {
  tests: TestFile[];
  type: AutomationType;
  projectName?: string;
  nodeVersion?: string;
}

/**
 * Generate a package.json file for running tests with Jest
 */
function generatePackageJson(options: AutomationFileOptions): string {
  const projectName = options.projectName || 'test-runner';
  const nodeVersion = options.nodeVersion || '18';
  
  return JSON.stringify({
    "name": projectName,
    "version": "1.0.0",
    "description": "Generated test runner using Jest",
    "scripts": {
      "test": "jest",
      "test:watch": "jest --watch",
      "test:coverage": "jest --coverage"
    },
    "engines": {
      "node": `>=${nodeVersion}`
    },
    "jest": {
      "testEnvironment": "node",
      "testMatch": [
        "**/__tests__/**/*.js",
        "**/?(*.)+(spec|test).js"
      ],
      "collectCoverageFrom": [
        "**/*.js",
        "!node_modules/**",
        "!coverage/**",
        "!jest.config.js"
      ]
    },
    "dependencies": {},
    "devDependencies": {
      "jest": "^29.5.0"
    }
  }, null, 2);
}

/**
 * Generate a shell script to run tests
 */
function generateShellScript(options: AutomationFileOptions): string {
  const testCommands = [
    "#!/bin/bash",
    "",
    "# Generated test runner script",
    "echo 'Installing dependencies...'",
    "npm install",
    "",
    "echo 'Running tests...'",
    "npm test",
    "",
    "# Check if tests passed",
    "if [ $? -eq 0 ]; then",
    "  echo 'All tests passed!'",
    "  exit 0",
    "else",
    "  echo 'Tests failed!'",
    "  exit 1",
    "fi",
    ""
  ];
  
  return testCommands.join('\n');
}

/**
 * Generate a GitHub Actions workflow file for CI
 */
function generateGitHubActionsYaml(options: AutomationFileOptions): string {
  const nodeVersion = options.nodeVersion || '18';
  
  return `name: Test

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [${nodeVersion}]

    steps:
    - uses: actions/checkout@v3
    - name: Use Node.js \${{ matrix.node-version }}
      uses: actions/setup-node@v3
      with:
        node-version: \${{ matrix.node-version }}
        cache: 'npm'
    - run: npm ci
    - run: npm test
    - name: Upload coverage reports
      uses: codecov/codecov-action@v3
      if: always()
`;
}

/**
 * Generate a Dockerfile for running tests
 */
function generateDockerfile(options: AutomationFileOptions): string {
  const nodeVersion = options.nodeVersion || '18';
  
  return `FROM node:${nodeVersion}-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

CMD ["npm", "test"]
`;
}

/**
 * Generate the appropriate automation file based on the requested type
 */
export function generateAutomationFile(options: AutomationFileOptions): {
  content: string;
  filename: string;
  type: string;
} {
  switch (options.type) {
    case 'package_json':
      return {
        content: generatePackageJson(options),
        filename: 'package.json',
        type: 'application/json'
      };
    case 'shell_script':
      return {
        content: generateShellScript(options),
        filename: 'run-tests.sh',
        type: 'text/plain'
      };
    case 'github_actions':
      return {
        content: generateGitHubActionsYaml(options),
        filename: 'github-workflow.yml',
        type: 'text/yaml'
      };
    case 'dockerfile':
      return {
        content: generateDockerfile(options),
        filename: 'Dockerfile',
        type: 'text/plain'
      };
    default:
      throw new Error(`Unsupported automation type: ${options.type}`);
  }
}