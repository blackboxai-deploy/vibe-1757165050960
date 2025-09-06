'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import QRCode from 'qrcode';

interface Student {
  id: number;
  name: string;
  strand: string;
  qr_code: string;
  created_at: string;
}

export default function GeneratorPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [generatingQRs, setGeneratingQRs] = useState(false);
  const router = useRouter();

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
        student.strand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.qr_code.toLowerCase().includes(searchQuery.toLowerCase())
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

  const generateQRCode = async (text: string): Promise<string> => {
    try {
      const qrCodeDataURL = await QRCode.toDataURL(text, {
        width: 256,
        margin: 2,
        color: {
          dark: '#7f1d1d',
          light: '#ffffff'
        }
      });
      return qrCodeDataURL;
    } catch (error) {
      console.error('QR Code generation error:', error);
      throw error;
    }
  };

  const downloadQRCode = async (student: Student) => {
    try {
      const qrCodeDataURL = await generateQRCode(student.qr_code);
      
      const link = document.createElement('a');
      link.download = `QR_${student.name.replace(/\s+/g, '_')}.png`;
      link.href = qrCodeDataURL;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(`QR code downloaded for ${student.name}`);
    } catch (error) {
      toast.error('Failed to generate QR code');
    }
  };

  const downloadAllQRCodes = async () => {
    if (filteredStudents.length === 0) {
      toast.error('No students available');
      return;
    }

    setGeneratingQRs(true);
    
    try {
      for (const student of filteredStudents) {
        await downloadQRCode(student);
        // Small delay to prevent overwhelming the browser
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      toast.success(`Downloaded ${filteredStudents.length} QR codes`);
    } catch (error) {
      toast.error('Failed to download all QR codes');
    } finally {
      setGeneratingQRs(false);
    }
  };

  const handleExportCSV = async () => {
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
        a.download = 'students_with_qr.csv';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('CSV exported successfully');
      } else {
        toast.error('Export failed');
      }
    } catch (error) {
      toast.error('Export failed');
    }
  };

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    e.target.value = '';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation onSearch={setSearchQuery} />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-800 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading QR generator...</p>
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
              <h1 className="text-3xl font-bold text-gray-900">QR Code Generator</h1>
              <p className="mt-1 text-sm text-gray-600">
                Generate and download QR codes for students
              </p>
            </div>
            
            <div className="flex space-x-3">
              <input
                type="file"
                id="import-csv"
                accept=".csv"
                onChange={handleImportCSV}
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
                onClick={handleExportCSV}
                variant="outline"
                className="border-red-800 text-red-800 hover:bg-red-50"
              >
                Export CSV
              </Button>
              
              <Button
                onClick={downloadAllQRCodes}
                disabled={generatingQRs || filteredStudents.length === 0}
                className="bg-red-800 hover:bg-red-900"
              >
                {generatingQRs ? 'Generating...' : 'Download All QR Codes'}
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-red-900">Student QR Codes</CardTitle>
              <CardDescription>
                {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''} available
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
                      <TableHead className="font-semibold text-red-800">QR Code ID</TableHead>
                      <TableHead className="font-semibold text-red-800">Preview</TableHead>
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
                          <TableCell>
                            <div className="w-16 h-16 bg-gray-100 rounded border flex items-center justify-center">
                              <span className="text-xs text-gray-500">QR Preview</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              onClick={() => downloadQRCode(student)}
                              size="sm"
                              className="bg-red-800 hover:bg-red-900"
                            >
                              Download
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                          {searchQuery ? `No students found matching "${searchQuery}"` : 'No students available'}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <div className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-red-900">How to Use</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>• Each student gets a unique QR code that can be scanned for attendance</p>
                  <p>• Download individual QR codes or all at once</p>
                  <p>• Import students from CSV file format: Name, Strand</p>
                  <p>• Export the current list with QR codes for backup</p>
                  <p>• Use the search bar to filter students quickly</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}