'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalAttendanceToday: number;
  strandCounts: {
    HUMSS: number;
    ABM: number;
    CSS: number;
    SMAW: number;
    AUTO: number;
    EIM: number;
  };
  recentActivity: Array<{
    id: number;
    action: string;
    details: string;
    timestamp: string;
  }>;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notifications, setNotifications] = useState<string[]>([]);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      return;
    }
    fetchDashboardStats();
  }, [router]);

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
        
        // Check for attendance notifications
        if (data.absentStudents && data.absentStudents.length > 0) {
          const absentNotifications = data.absentStudents.map(
            (student: any) => `${student.name} has been absent for ${student.absentDays} days`
          );
          setNotifications(absentNotifications);
        }
      } else {
        toast.error('Failed to load dashboard data');
      }
    } catch (error) {
      toast.error('Network error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-800 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading dashboard...</p>
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
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="mt-1 text-sm text-gray-600">
              Overview of your attendance system
            </p>
          </div>

          {/* Notifications */}
          {notifications.length > 0 && (
            <div className="mb-6">
              <Card className="border-orange-200 bg-orange-50">
                <CardHeader>
                  <CardTitle className="text-orange-800">Notifications</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {notifications.map((notification, index) => (
                      <li key={index} className="text-orange-700 text-sm">
                        • {notification}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="border-red-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-red-800">Total Students</CardTitle>
                <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-red-600 text-xl">👥</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-900">
                  {stats?.totalStudents || 0}
                </div>
                <p className="text-xs text-red-600">
                  Registered in the system
                </p>
              </CardContent>
            </Card>

            <Card className="border-red-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-red-800">Total Teachers</CardTitle>
                <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-red-600 text-xl">👨‍🏫</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-900">
                  {stats?.totalTeachers || 0}
                </div>
                <p className="text-xs text-red-600">
                  Active staff members
                </p>
              </CardContent>
            </Card>

            <Card className="border-red-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-red-800">Today's Attendance</CardTitle>
                <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-red-600 text-xl">📋</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-900">
                  {stats?.totalAttendanceToday || 0}
                </div>
                <p className="text-xs text-red-600">
                  Students present today
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Strand Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="text-red-900">Students by Strand</CardTitle>
                <CardDescription>Distribution across different academic strands</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats?.strandCounts && Object.entries(stats.strandCounts).map(([strand, count]) => (
                    <div key={strand} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-4 h-4 bg-red-600 rounded"></div>
                        <span className="font-medium text-gray-700">{strand}</span>
                      </div>
                      <span className="text-red-900 font-bold">{count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="text-red-900">Recent Activity</CardTitle>
                <CardDescription>Latest system activities and changes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats?.recentActivity && stats.recentActivity.length > 0 ? (
                    stats.recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-red-600 rounded-full mt-2"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                          <p className="text-xs text-gray-600">{activity.details}</p>
                          <p className="text-xs text-gray-500">{activity.timestamp}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No recent activity</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}