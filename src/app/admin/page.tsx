'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

interface SystemStats {
  totalUsers: number;
  totalStudents: number;
  totalTeachers: number;
  totalAttendance: number;
  dbSize: string;
  lastBackup: string;
}

export default function AdminPage() {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      router.push('/');
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== 'admin') {
      toast.error('Admin access required');
      router.push('/dashboard');
      return;
    }

    setUser(parsedUser);
    fetchSystemStats();
  }, [router]);

  const fetchSystemStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        toast.error('Failed to load system statistics');
      }
    } catch (error) {
      toast.error('Network error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearAllData = async () => {
    if (!confirm('⚠️ WARNING: This will delete ALL data including students, teachers, and attendance records. This action cannot be undone. Are you absolutely sure?')) {
      return;
    }

    if (!confirm('Last chance! Type "DELETE ALL DATA" to confirm this destructive action.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/clear-all', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast.success('All data cleared successfully');
        fetchSystemStats();
      } else {
        toast.error('Failed to clear data');
      }
    } catch (error) {
      toast.error('Network error occurred');
    }
  };

  const handleDatabaseBackup = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/backup', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `attendance_backup_${new Date().toISOString().split('T')[0]}.sql`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Database backup created successfully');
      } else {
        toast.error('Failed to create backup');
      }
    } catch (error) {
      toast.error('Backup failed');
    }
  };

  const handleSystemReset = async () => {
    if (!confirm('This will reset the system to default settings. Continue?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/reset', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast.success('System reset successfully');
        fetchSystemStats();
      } else {
        toast.error('Failed to reset system');
      }
    } catch (error) {
      toast.error('Network error occurred');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-800 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading admin panel...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
              <p className="mt-1 text-sm text-gray-600">
                System administration and management tools
              </p>
            </div>
            
            <div className="flex space-x-3">
              <Button
                onClick={handleDatabaseBackup}
                className="bg-green-600 hover:bg-green-700"
              >
                Create Backup
              </Button>
              <Button
                onClick={handleSystemReset}
                variant="outline"
                className="border-orange-500 text-orange-600 hover:bg-orange-50"
              >
                Reset System
              </Button>
              <Button
                onClick={handleClearAllData}
                variant="destructive"
                className="bg-red-600 hover:bg-red-700"
              >
                Clear All Data
              </Button>
            </div>
          </div>

          {/* System Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="border-red-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-red-800">Total Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-900">
                  {stats?.totalUsers || 0}
                </div>
                <p className="text-xs text-red-600">System accounts</p>
              </CardContent>
            </Card>

            <Card className="border-red-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-red-800">Total Students</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-900">
                  {stats?.totalStudents || 0}
                </div>
                <p className="text-xs text-red-600">Registered students</p>
              </CardContent>
            </Card>

            <Card className="border-red-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-red-800">Total Teachers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-900">
                  {stats?.totalTeachers || 0}
                </div>
                <p className="text-xs text-red-600">Active teachers</p>
              </CardContent>
            </Card>

            <Card className="border-red-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-red-800">Attendance Records</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-900">
                  {stats?.totalAttendance || 0}
                </div>
                <p className="text-xs text-red-600">Total records</p>
              </CardContent>
            </Card>
          </div>

          {/* Admin Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-red-900">System Management</CardTitle>
                <CardDescription>
                  Core system administration tools
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">Add New Students</h3>
                    <p className="text-sm text-gray-600">Bulk add students with QR generation</p>
                  </div>
                  <Button
                    onClick={() => router.push('/students')}
                    className="bg-red-800 hover:bg-red-900"
                  >
                    Manage
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">Add New Teachers</h3>
                    <p className="text-sm text-gray-600">Manage teaching staff records</p>
                  </div>
                  <Button
                    onClick={() => router.push('/teachers')}
                    className="bg-red-800 hover:bg-red-900"
                  >
                    Manage
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">Generate QR Codes</h3>
                    <p className="text-sm text-gray-600">Create and download student QR codes</p>
                  </div>
                  <Button
                    onClick={() => router.push('/generator')}
                    className="bg-red-800 hover:bg-red-900"
                  >
                    Generate
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-red-900">Data Management</CardTitle>
                <CardDescription>
                  Backup, restore, and maintain system data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h3 className="font-medium text-green-900 mb-2">Database Backup</h3>
                  <p className="text-sm text-green-700 mb-3">
                    Create a complete backup of all system data
                  </p>
                  <Button
                    onClick={handleDatabaseBackup}
                    className="bg-green-600 hover:bg-green-700"
                    size="sm"
                  >
                    Download Backup
                  </Button>
                </div>

                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <h3 className="font-medium text-orange-900 mb-2">System Reset</h3>
                  <p className="text-sm text-orange-700 mb-3">
                    Reset system settings to defaults (keeps data)
                  </p>
                  <Button
                    onClick={handleSystemReset}
                    variant="outline"
                    className="border-orange-500 text-orange-600 hover:bg-orange-50"
                    size="sm"
                  >
                    Reset Settings
                  </Button>
                </div>

                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h3 className="font-medium text-red-900 mb-2">⚠️ Clear All Data</h3>
                  <p className="text-sm text-red-700 mb-3">
                    Permanently delete all students, teachers, and records
                  </p>
                  <Button
                    onClick={handleClearAllData}
                    variant="destructive"
                    className="bg-red-600 hover:bg-red-700"
                    size="sm"
                  >
                    Clear Everything
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* System Information */}
          <div className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-red-900">System Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Database Status</h4>
                    <p className="text-gray-600">Connected: ✅ Active</p>
                    <p className="text-gray-600">Size: {stats?.dbSize || 'Unknown'}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Last Backup</h4>
                    <p className="text-gray-600">{stats?.lastBackup || 'No backups yet'}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Admin User</h4>
                    <p className="text-gray-600">Logged in as: {user?.username}</p>
                    <p className="text-gray-600">Role: Administrator</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}