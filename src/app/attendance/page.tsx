'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';

interface AttendanceRecord {
  id: number;
  student_id: number;
  student_name: string;
  strand: string;
  date: string;
  time_in: string | null;
  time_out: string | null;
  remarks: 'present' | 'late' | 'absent';
  created_at: string;
}

interface Student {
  id: number;
  name: string;
  strand: string;
}

export default function AttendancePage() {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [filteredAttendance, setFilteredAttendance] = useState<AttendanceRecord[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newAttendance, setNewAttendance] = useState({
    student_id: '',
    date: new Date().toISOString().split('T')[0],
    time_in: new Date().toTimeString().slice(0, 5),
    time_out: '',
    remarks: 'present' as 'present' | 'late' | 'absent'
  });
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      return;
    }
    fetchAttendance();
    fetchStudents();
  }, [router]);

  useEffect(() => {
    if (searchQuery) {
      const filtered = attendance.filter(record =>
        record.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.strand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.date.includes(searchQuery) ||
        record.remarks.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredAttendance(filtered);
    } else {
      setFilteredAttendance(attendance);
    }
  }, [searchQuery, attendance]);

  const fetchAttendance = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/attendance', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAttendance(data.attendance);
        setFilteredAttendance(data.attendance);
      } else {
        toast.error('Failed to load attendance records');
      }
    } catch (error) {
      toast.error('Network error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/students', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStudents(data.students);
      }
    } catch (error) {
      console.error('Failed to fetch students');
    }
  };

  const handleAddAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newAttendance.student_id || !newAttendance.date) {
      toast.error('Student and date are required');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newAttendance,
          student_id: parseInt(newAttendance.student_id),
        }),
      });

      if (response.ok) {
        toast.success('Attendance recorded successfully');
        setNewAttendance({
          student_id: '',
          date: new Date().toISOString().split('T')[0],
          time_in: new Date().toTimeString().slice(0, 5),
          time_out: '',
          remarks: 'present'
        });
        setShowAddDialog(false);
        fetchAttendance();
      } else {
        const data = await response.json();
        toast.error(data.message || 'Failed to record attendance');
      }
    } catch (error) {
      toast.error('Network error occurred');
    }
  };

  const handleDeleteAttendance = async (id: number) => {
    if (!confirm('Are you sure you want to delete this attendance record?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/attendance/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast.success('Attendance record deleted');
        fetchAttendance();
      } else {
        toast.error('Failed to delete attendance record');
      }
    } catch (error) {
      toast.error('Network error occurred');
    }
  };

  const handleExport = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/attendance/export', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'attendance_records.csv';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Attendance records exported successfully');
      } else {
        toast.error('Export failed');
      }
    } catch (error) {
      toast.error('Export failed');
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.name.endsWith('.csv')) {
      toast.error('Please select a CSV file');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/attendance/import', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`${data.imported} attendance records imported successfully`);
        fetchAttendance();
      } else {
        const data = await response.json();
        toast.error(data.message || 'Import failed');
      }
    } catch (error) {
      toast.error('Import failed');
    }

    e.target.value = '';
  };

  const handleClearAll = async () => {
    if (!confirm('Are you sure you want to delete ALL attendance records? This cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/attendance/clear', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast.success('All attendance records cleared');
        fetchAttendance();
      } else {
        toast.error('Failed to clear attendance records');
      }
    } catch (error) {
      toast.error('Network error occurred');
    }
  };

  const getRemarksBadge = (remarks: string) => {
    const colors = {
      present: 'bg-green-100 text-green-800',
      late: 'bg-yellow-100 text-yellow-800',
      absent: 'bg-red-100 text-red-800',
    };
    return colors[remarks as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation onSearch={setSearchQuery} />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-800 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading attendance...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation onSearch={setSearchQuery} />
      
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Attendance Management</h1>
              <p className="mt-1 text-sm text-gray-600">
                Track and manage student attendance records
              </p>
            </div>
            
            <div className="flex space-x-3">
              <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-red-800 hover:bg-red-900">
                    Add Attendance
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Record Attendance</DialogTitle>
                    <DialogDescription>
                      Manually add an attendance record for a student.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleAddAttendance} className="space-y-4">
                    <div>
                      <Label htmlFor="student">Student</Label>
                      <select
                        id="student"
                        value={newAttendance.student_id}
                        onChange={(e) => setNewAttendance({...newAttendance, student_id: e.target.value})}
                        className="w-full p-2 border border-gray-300 rounded-md"
                        required
                      >
                        <option value="">Select student</option>
                        {students.map(student => (
                          <option key={student.id} value={student.id}>
                            {student.name} ({student.strand})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="date">Date</Label>
                      <Input
                        id="date"
                        type="date"
                        value={newAttendance.date}
                        onChange={(e) => setNewAttendance({...newAttendance, date: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="time_in">Time In</Label>
                      <Input
                        id="time_in"
                        type="time"
                        value={newAttendance.time_in}
                        onChange={(e) => setNewAttendance({...newAttendance, time_in: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="time_out">Time Out (Optional)</Label>
                      <Input
                        id="time_out"
                        type="time"
                        value={newAttendance.time_out}
                        onChange={(e) => setNewAttendance({...newAttendance, time_out: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="remarks">Remarks</Label>
                      <select
                        id="remarks"
                        value={newAttendance.remarks}
                        onChange={(e) => setNewAttendance({...newAttendance, remarks: e.target.value as 'present' | 'late' | 'absent'})}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      >
                        <option value="present">Present</option>
                        <option value="late">Late</option>
                        <option value="absent">Absent</option>
                      </select>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" className="bg-red-800 hover:bg-red-900">
                        Record Attendance
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
              
              <input
                type="file"
                id="import-csv"
                accept=".csv"
                onChange={handleImport}
                className="hidden"
              />
              <Button
                onClick={() => document.getElementById('import-csv')?.click()}
                variant="outline"
                className="border-red-800 text-red-800 hover:bg-red-50"
              >
                Import CSV
              </Button>
              
              <Button
                onClick={handleExport}
                variant="outline"
                className="border-red-800 text-red-800 hover:bg-red-50"
              >
                Export CSV
              </Button>
              
              <Button
                onClick={handleClearAll}
                variant="destructive"
                className="bg-red-600 hover:bg-red-700"
              >
                Clear All
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-red-900">Attendance Records</CardTitle>
              <CardDescription>
                {filteredAttendance.length} record{filteredAttendance.length !== 1 ? 's' : ''} found
                {searchQuery && ` for "${searchQuery}"`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-semibold text-red-800">Date</TableHead>
                      <TableHead className="font-semibold text-red-800">Student Name</TableHead>
                      <TableHead className="font-semibold text-red-800">Strand</TableHead>
                      <TableHead className="font-semibold text-red-800">Time In</TableHead>
                      <TableHead className="font-semibold text-red-800">Time Out</TableHead>
                      <TableHead className="font-semibold text-red-800">Remarks</TableHead>
                      <TableHead className="font-semibold text-red-800">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAttendance.length > 0 ? (
                      filteredAttendance.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                          <TableCell className="font-medium">{record.student_name}</TableCell>
                          <TableCell>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              {record.strand}
                            </span>
                          </TableCell>
                          <TableCell>{record.time_in || '-'}</TableCell>
                          <TableCell>{record.time_out || '-'}</TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRemarksBadge(record.remarks)}`}>
                              {record.remarks.charAt(0).toUpperCase() + record.remarks.slice(1)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Button
                              onClick={() => handleDeleteAttendance(record.id)}
                              variant="destructive"
                              size="sm"
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                          {searchQuery ? `No attendance records found matching "${searchQuery}"` : 'No attendance records found'}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}