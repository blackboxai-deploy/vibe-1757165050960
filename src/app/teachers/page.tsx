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

interface Teacher {
  id: number;
  name: string;
  position: string;
  created_at: string;
}

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [filteredTeachers, setFilteredTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newTeacher, setNewTeacher] = useState({ name: '', position: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      return;
    }
    fetchTeachers();
  }, [router]);

  useEffect(() => {
    if (searchQuery) {
      const filtered = teachers.filter(teacher =>
        teacher.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        teacher.position.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredTeachers(filtered);
    } else {
      setFilteredTeachers(teachers);
    }
  }, [searchQuery, teachers]);

  const fetchTeachers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/teachers', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTeachers(data.teachers);
        setFilteredTeachers(data.teachers);
      } else {
        toast.error('Failed to load teachers');
      }
    } catch (error) {
      toast.error('Network error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newTeacher.name.trim() || !newTeacher.position.trim()) {
      toast.error('Name and position are required');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/teachers', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newTeacher),
      });

      if (response.ok) {
        toast.success('Teacher added successfully');
        setNewTeacher({ name: '', position: '' });
        setShowAddDialog(false);
        fetchTeachers();
      } else {
        const data = await response.json();
        toast.error(data.message || 'Failed to add teacher');
      }
    } catch (error) {
      toast.error('Network error occurred');
    }
  };

  const handleDeleteTeacher = async (id: number) => {
    if (!confirm('Are you sure you want to delete this teacher?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/teachers/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast.success('Teacher deleted successfully');
        fetchTeachers();
      } else {
        toast.error('Failed to delete teacher');
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
            <p className="mt-4 text-gray-600">Loading teachers...</p>
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
              <h1 className="text-3xl font-bold text-gray-900">Teachers Management</h1>
              <p className="mt-1 text-sm text-gray-600">
                Manage teaching staff and their positions
              </p>
            </div>
            
            <div className="flex space-x-3">
              <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-red-800 hover:bg-red-900">
                    Add Teacher
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Teacher</DialogTitle>
                    <DialogDescription>
                      Enter the teacher's information below.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleAddTeacher} className="space-y-4">
                    <div>
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        value={newTeacher.name}
                        onChange={(e) => setNewTeacher({...newTeacher, name: e.target.value})}
                        placeholder="Enter teacher name"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="position">Position</Label>
                      <Input
                        id="position"
                        value={newTeacher.position}
                        onChange={(e) => setNewTeacher({...newTeacher, position: e.target.value})}
                        placeholder="e.g. Teacher 3, Department Head, Principal"
                        required
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" className="bg-red-800 hover:bg-red-900">
                        Add Teacher
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-red-900">Teachers List</CardTitle>
              <CardDescription>
                {filteredTeachers.length} teacher{filteredTeachers.length !== 1 ? 's' : ''} found
                {searchQuery && ` for "${searchQuery}"`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-semibold text-red-800">Name</TableHead>
                      <TableHead className="font-semibold text-red-800">Position</TableHead>
                      <TableHead className="font-semibold text-red-800">Created</TableHead>
                      <TableHead className="font-semibold text-red-800">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTeachers.length > 0 ? (
                      filteredTeachers.map((teacher) => (
                        <TableRow key={teacher.id}>
                          <TableCell className="font-medium">{teacher.name}</TableCell>
                          <TableCell>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              {teacher.position}
                            </span>
                          </TableCell>
                          <TableCell>{new Date(teacher.created_at).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Button
                              onClick={() => handleDeleteTeacher(teacher.id)}
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
                        <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                          {searchQuery ? `No teachers found matching "${searchQuery}"` : 'No teachers found'}
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