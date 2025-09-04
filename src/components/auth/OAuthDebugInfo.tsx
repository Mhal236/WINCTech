import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function OAuthDebugInfo() {
  const [debugInfo, setDebugInfo] = useState({
    currentUrl: '',
    hostname: '',
    origin: '',
    envVars: {
      viteBaseUrl: '',
      viteSiteUrl: '',
      supabaseUrl: '',
    },
    urlParams: {} as Record<string, string>
  });

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const params: Record<string, string> = {};
    urlParams.forEach((value, key) => {
      params[key] = value;
    });

    setDebugInfo({
      currentUrl: window.location.href,
      hostname: window.location.hostname,
      origin: window.location.origin,
      envVars: {
        viteBaseUrl: import.meta.env.VITE_BASE_URL || 'Not set',
        viteSiteUrl: import.meta.env.VITE_SITE_URL || 'Not set',
        supabaseUrl: import.meta.env.VITE_SUPABASE_URL || 'Not set',
      },
      urlParams: params
    });
  }, []);

  // Only show in development or when there are URL parameters (like OAuth callback)
  if (import.meta.env.PROD && Object.keys(debugInfo.urlParams).length === 0) {
    return null;
  }

  return (
    <Card className="mb-4 border-yellow-200 bg-yellow-50">
      <CardHeader>
        <CardTitle className="text-sm text-yellow-800">OAuth Debug Info</CardTitle>
      </CardHeader>
      <CardContent className="text-xs space-y-2">
        <div>
          <strong>Current URL:</strong> {debugInfo.currentUrl}
        </div>
        <div>
          <strong>Hostname:</strong> {debugInfo.hostname}
        </div>
        <div>
          <strong>Origin:</strong> {debugInfo.origin}
        </div>
        <div>
          <strong>Environment Variables:</strong>
          <ul className="ml-4 mt-1">
            <li>VITE_BASE_URL: {debugInfo.envVars.viteBaseUrl}</li>
            <li>VITE_SITE_URL: {debugInfo.envVars.viteSiteUrl}</li>
            <li>VITE_SUPABASE_URL: {debugInfo.envVars.supabaseUrl}</li>
          </ul>
        </div>
        {Object.keys(debugInfo.urlParams).length > 0 && (
          <div>
            <strong>URL Parameters:</strong>
            <ul className="ml-4 mt-1">
              {Object.entries(debugInfo.urlParams).map(([key, value]) => (
                <li key={key}>
                  {key}: {value}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
