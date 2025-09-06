'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import Webcam from 'react-webcam';

interface ScanResult {
  type: 'qr' | 'face';
  studentId?: number;
  studentName?: string;
  timestamp: string;
  status: 'success' | 'error';
  message: string;
}

export default function ScannerPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [scanResults, setScanResults] = useState<ScanResult[]>([]);
  const [activeTab, setActiveTab] = useState('qr');
  const webcamRef = useRef<Webcam>(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      return;
    }
  }, [router]);

  const startCamera = async () => {
    try {
      setCameraActive(true);
      toast.success('Camera activated');
    } catch (error) {
      toast.error('Failed to start camera');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    setCameraActive(false);
    toast.info('Camera deactivated');
  };

  const captureAndScan = async () => {
    if (!webcamRef.current) {
      toast.error('Camera not available');
      return;
    }

    setIsLoading(true);

    try {
      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) {
        toast.error('Failed to capture image');
        return;
      }

      // Convert data URL to blob
      const response = await fetch(imageSrc);
      const blob = await response.blob();

      // Create form data
      const formData = new FormData();
      formData.append('image', blob);
      formData.append('scanType', activeTab);

      // Send to scanner API
      const token = localStorage.getItem('token');
      const scanResponse = await fetch('/api/scanner/process', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await scanResponse.json();

      if (scanResponse.ok) {
        const scanResult: ScanResult = {
          type: activeTab as 'qr' | 'face',
          studentId: result.studentId,
          studentName: result.studentName,
          timestamp: new Date().toLocaleString(),
          status: 'success',
          message: result.message,
        };

        setScanResults(prev => [scanResult, ...prev]);
        toast.success(result.message);

        // Automatically record attendance if student found
        if (result.studentId) {
          await recordAttendance(result.studentId);
        }
      } else {
        const errorResult: ScanResult = {
          type: activeTab as 'qr' | 'face',
          timestamp: new Date().toLocaleString(),
          status: 'error',
          message: result.message || 'Scan failed',
        };

        setScanResults(prev => [errorResult, ...prev]);
        toast.error(result.message || 'Scan failed');
      }
    } catch (error) {
      const errorResult: ScanResult = {
        type: activeTab as 'qr' | 'face',
        timestamp: new Date().toLocaleString(),
        status: 'error',
        message: 'Network error occurred',
      };

      setScanResults(prev => [errorResult, ...prev]);
      toast.error('Network error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const recordAttendance = async (studentId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/attendance/record', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId,
          scanMethod: activeTab,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(`Attendance recorded: ${result.remarks}`);
      }
    } catch (error) {
      console.error('Attendance recording error:', error);
    }
  };

  const clearResults = () => {
    setScanResults([]);
    toast.info('Scan results cleared');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Scanner</h1>
              <p className="mt-1 text-sm text-gray-600">
                Scan QR codes or use face recognition for attendance
              </p>
            </div>
            
            <div className="flex space-x-3">
              <Button
                onClick={clearResults}
                variant="outline"
                className="border-red-800 text-red-800 hover:bg-red-50"
              >
                Clear Results
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Scanner Interface */}
            <Card>
              <CardHeader>
                <CardTitle className="text-red-900">Live Scanner</CardTitle>
                <CardDescription>
                  Choose your scanning method and capture images
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
                  <TabsList className="grid w-full grid-cols-2 bg-red-100">
                    <TabsTrigger value="qr" className="data-[state=active]:bg-red-800 data-[state=active]:text-white">
                      QR Code Scanner
                    </TabsTrigger>
                    <TabsTrigger value="face" className="data-[state=active]:bg-red-800 data-[state=active]:text-white">
                      Face Scanner
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="qr" className="mt-4">
                    <div className="text-center space-y-4">
                      <div className="bg-red-50 p-4 rounded-lg">
                        <h3 className="font-medium text-red-900 mb-2">QR Code Scanner</h3>
                        <p className="text-sm text-red-700">
                          Position the QR code within the camera frame and capture
                        </p>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="face" className="mt-4">
                    <div className="text-center space-y-4">
                      <div className="bg-red-50 p-4 rounded-lg">
                        <h3 className="font-medium text-red-900 mb-2">Face Recognition Scanner</h3>
                        <p className="text-sm text-red-700">
                          Look directly at the camera and capture for face recognition
                        </p>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                {/* Camera Interface */}
                <div className="space-y-4">
                  <div className="bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '4/3' }}>
                    {cameraActive ? (
                      <Webcam
                        ref={webcamRef}
                        audio={false}
                        screenshotFormat="image/jpeg"
                        width="100%"
                        height="100%"
                        videoConstraints={{
                          width: 640,
                          height: 480,
                          facingMode: 'user'
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white">
                        <div className="text-center">
                          <div className="text-6xl mb-4">📷</div>
                          <p>Camera is off</p>
                          <p className="text-sm text-gray-300">Click "Start Camera" to begin scanning</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-center space-x-3">
                    {!cameraActive ? (
                      <Button
                        onClick={startCamera}
                        className="bg-red-800 hover:bg-red-900"
                      >
                        Start Camera
                      </Button>
                    ) : (
                      <>
                        <Button
                          onClick={captureAndScan}
                          disabled={isLoading}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {isLoading ? 'Scanning...' : 'Capture & Scan'}
                        </Button>
                        <Button
                          onClick={stopCamera}
                          variant="outline"
                          className="border-red-800 text-red-800 hover:bg-red-50"
                        >
                          Stop Camera
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Scan Results */}
            <Card>
              <CardHeader>
                <CardTitle className="text-red-900">Scan Results</CardTitle>
                <CardDescription>
                  Recent scanning activity and results
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {scanResults.length > 0 ? (
                    scanResults.map((result, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border ${
                          result.status === 'success' 
                            ? 'bg-green-50 border-green-200' 
                            : 'bg-red-50 border-red-200'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                            result.type === 'qr' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-purple-100 text-purple-800'
                          }`}>
                            {result.type === 'qr' ? 'QR Code' : 'Face Recognition'}
                          </span>
                          <span className="text-xs text-gray-500">{result.timestamp}</span>
                        </div>
                        
                        {result.studentName && (
                          <p className="font-medium text-gray-900 mb-1">
                            Student: {result.studentName}
                          </p>
                        )}
                        
                        <p className={`text-sm ${
                          result.status === 'success' ? 'text-green-800' : 'text-red-800'
                        }`}>
                          {result.message}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <div className="text-4xl mb-2">🔍</div>
                      <p>No scan results yet</p>
                      <p className="text-sm text-gray-400">Start scanning to see results here</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Instructions */}
          <div className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-red-900">Scanner Instructions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-600">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">QR Code Scanning</h4>
                    <ul className="space-y-1">
                      <li>• Ensure good lighting for clear QR code visibility</li>
                      <li>• Hold the QR code steady within the camera frame</li>
                      <li>• QR codes are automatically processed for attendance</li>
                      <li>• Invalid QR codes will show error messages</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Face Recognition</h4>
                    <ul className="space-y-1">
                      <li>• Look directly at the camera with good lighting</li>
                      <li>• Remove accessories that may obstruct face features</li>
                      <li>• Face data must be pre-registered in the system</li>
                      <li>• Recognition accuracy depends on image quality</li>
                    </ul>
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