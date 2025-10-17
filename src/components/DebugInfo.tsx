import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'react-router-dom';

export function DebugInfo() {
  const [isExpanded, setIsExpanded] = useState(false);
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (import.meta.env.MODE !== 'development') {
    return null;
  }

  // Check verification status for debug
  const needsVerification = !user || 
    (user.verification_status === 'non-verified' || 
     user.verification_status === 'pending' || 
     user.verification_status === 'rejected') ||
    (!user.verification_status && 
     (user.user_role === 'non-verified' || 
      (!user.user_role && user.user_role !== 'admin')));

  return (
    <div className="fixed top-20 right-4 z-50">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`bg-gray-800 text-white p-2 rounded-md shadow-lg ${
          needsVerification ? 'bg-red-600' : ''
        }`}
      >
        Debug {needsVerification ? '⚠️' : '✓'}
      </button>
      
      {isExpanded && (
        <div className="bg-white p-4 rounded-md shadow-lg mt-2 border border-gray-300 max-w-md overflow-auto max-h-96">
          <h3 className="font-bold mb-2">Auth Debug Info</h3>
          <div className="text-xs font-mono space-y-1">
            <p><strong>Route:</strong> {location.pathname}</p>
            <p><strong>Loading:</strong> {String(isLoading)}</p>
            <p><strong>User:</strong> {user ? 'Yes' : 'No'}</p>
            <p><strong>Needs Verification:</strong> <span className={needsVerification ? 'text-red-600 font-bold' : 'text-green-600'}>{String(needsVerification)}</span></p>
            {user && (
              <>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Name:</strong> {user.name}</p>
                <p><strong>Role:</strong> {user.user_role || 'user'}</p>
                <p><strong>Verification:</strong> {user.verification_status || 'none'}</p>
                <div className="mt-2">
                  <strong>User Object:</strong>
                  <pre className="bg-gray-100 p-2 rounded overflow-auto text-[10px]">
                    {JSON.stringify(user, null, 2)}
                  </pre>
                </div>
              </>
            )}
            <div className="mt-2">
              <strong>Local Storage:</strong>
              <button 
                onClick={() => {
                  const item = localStorage.getItem('user_session');
                  console.log('User session in localStorage:', item ? JSON.parse(item) : null);
                  alert('Check console for localStorage data');
                }}
                className="ml-2 bg-blue-500 text-white text-xs p-1 rounded"
              >
                Log to Console
              </button>
            </div>
            <div className="mt-2">
              <button 
                onClick={() => {
                  localStorage.removeItem('user_session');
                  window.location.reload();
                }}
                className="bg-red-500 text-white text-xs p-1 rounded"
              >
                Clear Session & Reload
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 