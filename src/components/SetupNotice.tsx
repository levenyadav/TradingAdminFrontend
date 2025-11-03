import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Button } from './ui/button';
import { AlertCircle, ExternalLink, Code } from 'lucide-react';
import { config } from '../lib/config';

export function SetupNotice() {
  const enableMockData = () => {
    alert('To enable mock data:\n\n1. Open /lib/config.ts\n2. Set useMockData: true\n3. Refresh the page');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Alert className="border-blue-500 bg-blue-50">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertTitle className="text-blue-900">Backend Connection Required</AlertTitle>
        <AlertDescription className="text-blue-800 space-y-4 mt-2">
          <p>
            The admin panel is trying to connect to: <code className="bg-blue-100 px-2 py-1 rounded">{config.apiUrl}</code>
          </p>
          
          <div className="space-y-2">
            <p className="font-medium">To get started:</p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>Make sure your backend server is running at the configured URL</li>
              <li>Update the API URL in <code className="bg-blue-100 px-1 rounded">/lib/config.ts</code> if needed</li>
              <li>Ensure CORS is enabled on your backend for this frontend URL</li>
              <li>Set your authentication token (see SETUP.md for details)</li>
            </ol>
          </div>

          <div className="flex flex-wrap gap-3 mt-4">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => window.location.href = '/SETUP.md'}
            >
              <ExternalLink className="h-4 w-4" />
              View Setup Guide
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              onClick={enableMockData}
            >
              <Code className="h-4 w-4" />
              Enable Mock Data Mode
            </Button>
            <Button
              onClick={() => window.location.reload()}
            >
              Retry Connection
            </Button>
          </div>

          <div className="mt-4 p-3 bg-white rounded border border-blue-200">
            <p className="text-sm">
              <strong>Quick Fix:</strong> Enable mock data mode to test the UI without a backend:
            </p>
            <code className="block mt-2 text-xs bg-gray-100 p-2 rounded">
              // In /lib/config.ts<br />
              useMockData: true
            </code>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}
