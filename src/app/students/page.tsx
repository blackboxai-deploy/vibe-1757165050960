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

interface Student {
  id: number;
  name: string;
  strand: string;
  qr_code: string;
  created_at: string;
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newStudent, setNewStudent] = useState({ name: '', strand: 'HUMSS' });
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const strands = ['HUMSS', 'ABM', 'CSS', 'SMAW', 'AUTO', 'EIM'];

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      return;
    }
    fetchStudents();
  }, [router]);

  useEffect(() => {
    if (searchQuery) {
      const filtered = students.filter(student =>
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.strand.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredStudents(filtered);
    } else {
      setFilteredStudents(students);
    }
  }, [searchQuery, students]);

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
        setFilteredStudents(data.students);
      } else {
        toast.error('Failed to load students');
      }
    } catch (error) {
      toast.error('Network error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newStudent.name.trim()) {
      toast.error('Student name is required');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/students', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newStudent),
      });

      if (response.ok) {
        toast.success('Student added successfully');
        setNewStudent({ name: '', strand: 'HUMSS' });
        setShowAddDialog(false);
        fetchStudents();
      } else {
        const data = await response.json();
        toast.error(data.message || 'Failed to add student');
      }
    } catch (error) {
      toast.error('Network error occurred');
    }
  };

  const handleDeleteStudent = async (id: number) => {
    if (!confirm('Are you sure you want to delete this student?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/students/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast.success('Student deleted successfully');
        fetchStudents();
      } else {
        toast.error('Failed to delete student');
      }
    } catch (error) {
      toast.error('Network error occurred');
    }
  };

  const handleExport = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/students/export', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'students.csv';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Students exported successfully');
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
      const response = await fetch('/api/students/import', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`${data.imported} students imported successfully`);
        fetchStudents();
      } else {
        const data = await response.json();
        toast.error(data.message || 'Import failed');
      }
    } catch (error) {
      toast.error('Import failed');
    }

    // Reset file input
    e.target.value = '';
  };

  const handleClearAll = async () => {
    if (!confirm('Are you sure you want to delete ALL students? This cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/students/clear', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast.success('All students cleared');
        fetchStudents();
      } else {
        toast.error('Failed to clear students');
      }
    } catch (error) {
      toast.error('Network error occurred');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation onSearch={setSearchQuery} />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-800 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading students...</p>
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
              <h1 className="text-3xl font-bold text-gray-900">Students Management</h1>
              <p className="mt-1 text-sm text-gray-600">
                Manage student records and information
              </p>
            </div>
            
            <div className="flex space-x-3">
              <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-red-800 hover:bg-red-900">
                    Add Student
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Student</DialogTitle>
                    <DialogDescription>
                      Enter the student's information below.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleAddStudent} className="space-y-4">
                    <div>
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        value={newStudent.name}
                        onChange={(e) => setNewStudent({...newStudent, name: e.target.value})}
                        placeholder="Enter student name"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="strand">Strand</Label>
                      <select
                        id="strand"
                        value={newStudent.strand}
                        onChange={(e) => setNewStudent({...newStudent, strand: e.target.value})}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      >
                        {strands.map(strand => (
                          <option key={strand} value={strand}>{strand}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" className="bg-red-800 hover:bg-red-900">
                        Add Student
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
              <CardTitle className="text-red-900">Students List</CardTitle>
              <CardDescription>
                {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''} found
                {searchQuery && ` for "${searchQuery}"`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-semibold text-red-800">Name</TableHead>
                      <TableHead className="font-semibold text-red-800">Strand</TableHead>
                      <TableHead className="font-semibold text-red-800">QR Code</TableHead>
                      <TableHead className="font-semibold text-red-800">Created</TableHead>
                      <TableHead className="font-semibold text-red-800">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.length > 0 ? (
                      filteredStudents.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell className="font-medium">{student.name}</TableCell>
                          <TableCell>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              {student.strand}
                            </span>
                          </TableCell>
                          <TableCell className="font-mono text-sm">{student.qr_code}</TableCell>
                          <TableCell>{new Date(student.created_at).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Button
                              onClick={() => handleDeleteStudent(student.id)}
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
                        <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                          {searchQuery ? `No students found matching "${searchQuery}"` : 'No students found'}
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