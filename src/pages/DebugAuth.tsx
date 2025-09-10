import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRoleBasedAccess } from '@/components/auth/RoleBasedAccess';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

export default function DebugAuth() {
  const auth = useAuth();
  const roleAccess = useRoleBasedAccess();

  const testPermissions = [
    { name: 'User Level', role: 'user' },
    { name: 'Pro-1 Level', role: 'pro-1' },
    { name: 'Pro-2 Level', role: 'pro-2' },
    { name: 'Admin Level', role: 'admin' },
  ];

  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Authentication Debug Page</h1>
        
        {/* Auth Context Data */}
        <div className="mb-8 p-4 bg-gray-50 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">Auth Context Data</h2>
          <div className="space-y-2 text-sm">
            <div><strong>User ID:</strong> {auth.user?.id || 'Not set'}</div>
            <div><strong>Email:</strong> {auth.user?.email || 'Not set'}</div>
            <div><strong>Name:</strong> {auth.user?.name || 'Not set'}</div>
            <div><strong>User Role:</strong> {auth.user?.user_role || 'Not set'}</div>
            <div><strong>Verification Status:</strong> {auth.user?.verification_status || 'Not set'}</div>
            <div><strong>Is Loading:</strong> {auth.isLoading ? 'Yes' : 'No'}</div>
            <div><strong>Session Exists:</strong> {auth.session ? 'Yes' : 'No'}</div>
          </div>
        </div>

        {/* Role Access Data */}
        <div className="mb-8 p-4 bg-blue-50 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">Role Access Data</h2>
          <div className="space-y-2 text-sm">
            <div><strong>Is Admin:</strong> {roleAccess.isAdmin ? 'Yes' : 'No'}</div>
            <div><strong>Is Staff:</strong> {roleAccess.isStaff ? 'Yes' : 'No'}</div>
            <div><strong>Is User:</strong> {roleAccess.isUser ? 'Yes' : 'No'}</div>
          </div>
        </div>

        {/* Permission Tests */}
        <div className="mb-8 p-4 bg-green-50 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">Permission Tests</h2>
          <div className="grid grid-cols-2 gap-4">
            {testPermissions.map((test) => (
              <div key={test.role} className="flex justify-between items-center p-2 bg-white rounded">
                <span>{test.name}:</span>
                <span className={`font-semibold ${
                  auth.hasPermission(test.role) ? 'text-green-600' : 'text-red-600'
                }`}>
                  {auth.hasPermission(test.role) ? '✅ Allowed' : '❌ Denied'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation Tests */}
        <div className="mb-8 p-4 bg-yellow-50 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">Navigation Access Tests</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex justify-between items-center p-2 bg-white rounded">
              <span>Home (user):</span>
              <span className={`font-semibold ${
                roleAccess.hasPermission('user') ? 'text-green-600' : 'text-red-600'
              }`}>
                {roleAccess.hasPermission('user') ? '✅ Allowed' : '❌ Denied'}
              </span>
            </div>
            <div className="flex justify-between items-center p-2 bg-white rounded">
              <span>Jobs (admin):</span>
              <span className={`font-semibold ${
                roleAccess.hasPermission('admin') ? 'text-green-600' : 'text-red-600'
              }`}>
                {roleAccess.hasPermission('admin') ? '✅ Allowed' : '❌ Denied'}
              </span>
            </div>
            <div className="flex justify-between items-center p-2 bg-white rounded">
              <span>History (admin):</span>
              <span className={`font-semibold ${
                roleAccess.hasPermission('admin') ? 'text-green-600' : 'text-red-600'
              }`}>
                {roleAccess.hasPermission('admin') ? '✅ Allowed' : '❌ Denied'}
              </span>
            </div>
            <div className="flex justify-between items-center p-2 bg-white rounded">
              <span>ARGIC Search (pro-2):</span>
              <span className={`font-semibold ${
                roleAccess.hasPermission('pro-2') ? 'text-green-600' : 'text-red-600'
              }`}>
                {roleAccess.hasPermission('pro-2') ? '✅ Allowed' : '❌ Denied'}
              </span>
            </div>
          </div>
        </div>

        {/* Raw User Object */}
        <div className="p-4 bg-gray-100 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">Raw User Object</h2>
          <pre className="text-xs bg-white p-3 rounded overflow-auto">
            {JSON.stringify(auth.user, null, 2)}
          </pre>
        </div>
      </div>
    </DashboardLayout>
  );
}
