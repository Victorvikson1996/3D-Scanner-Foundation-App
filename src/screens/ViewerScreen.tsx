import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  Alert,
  Modal,
  Share
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import {
  Download,
  Share as ShareIcon,
  Trash2,
  Eye,
  EyeOff,
  RefreshCw,
  Grid3X3,
  Box,
  Image as ImageIcon
} from 'lucide-react-native';
import { Button } from '@/components/Button';
import { PointCloudViewer } from '@/components/PointCloudViewer';
import { SCANNER_CONSTANTS } from '@/constants/Scanner';
import { PointCloud } from '@/types/Scanner';
import { StorageService } from '@/utils/StorageService';
import { useFocusEffect } from '@react-navigation/native';
import { DepthProcessor } from '@/utils/DepthProcessor';

export const ViewerScreen = () => {
  const [pointClouds, setPointClouds] = useState<PointCloud[]>([]);
  const [selectedCloud, setSelectedCloud] = useState<PointCloud | null>(null);
  const [isViewing, setIsViewing] = useState(false);
  const [viewMode, setViewMode] = useState<'3d' | '2d'>('3d');
  const [isLoading, setIsLoading] = useState(false);

  const loadPointClouds = async () => {
    try {
      console.log('ViewerScreen: Starting to load point clouds...');
      setIsLoading(true);
      const storedPointClouds = await StorageService.getPointClouds();
      console.log(
        'ViewerScreen: Received point clouds:',
        storedPointClouds.length
      );
      console.log('ViewerScreen: Point clouds data:', storedPointClouds);
      setPointClouds(storedPointClouds);
    } catch (error) {
      console.error('ViewerScreen: Failed to load point clouds:', error);
      Alert.alert('Error', 'Failed to load point clouds from storage.');
    } finally {
      setIsLoading(false);
    }
  };

  // Load point clouds when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      loadPointClouds();
    }, [])
  );

  const handleRefresh = () => {
    console.log('ViewerScreen: Manual refresh triggered');
    loadPointClouds();
  };

  const handleTestCreatePointCloud = async () => {
    console.log('ViewerScreen: Creating test point cloud...');
    try {
      const testPointCloud = DepthProcessor.createTestPointCloud(
        'Enhanced Test Point Cloud',
        'Test Device',
        15000,
        'complex'
      );

      await StorageService.savePointCloud(testPointCloud);
      console.log('ViewerScreen: Test point cloud saved');
      Alert.alert('Success', 'Enhanced test point cloud created and saved!');

      // Reload the list
      loadPointClouds();
    } catch (error) {
      console.error('ViewerScreen: Failed to create test point cloud:', error);
      Alert.alert('Error', 'Failed to create test point cloud');
    }
  };

  const handleTest3DViewer = () => {
    console.log('ViewerScreen: Testing 3D viewer...');
    const testCloud: PointCloud = {
      id: 'test_3d_viewer',
      name: '3D Viewer Test',
      points: [
        { x: 0, y: 0, z: 0 },
        { x: 1, y: 0, z: 0 },
        { x: 0, y: 1, z: 0 },
        { x: 0, y: 0, z: 1 },
        { x: -1, y: 0, z: 0 },
        { x: 0, y: -1, z: 0 },
        { x: 0, y: 0, z: -1 }
      ],
      timestamp: Date.now(),
      metadata: {
        deviceType: 'Test Device',
        scanDuration: 5000,
        pointCount: 7,
        boundingBox: {
          min: { x: -1, y: -1, z: -1 },
          max: { x: 1, y: 1, z: 1 }
        }
      }
    };

    setSelectedCloud(testCloud);
    setIsViewing(true);
    setViewMode('3d');
  };

  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    return `${seconds}s`;
  };

  const handleView = (cloud: PointCloud) => {
    setSelectedCloud(cloud);
    setIsViewing(true);
    setViewMode('3d'); // Default to 3D view
  };

  const handleShare = async (cloud: PointCloud) => {
    Alert.alert(
      'Share Point Cloud',
      `Choose sharing format for "${cloud.name}"`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Share Info',
          onPress: () => shareInfo(cloud)
        },
        {
          text: 'Share as PLY',
          onPress: () => shareAsPLY(cloud)
        },
        {
          text: 'Share as JSON',
          onPress: () => shareAsJSON(cloud)
        },
        {
          text: 'Share as PDF',
          onPress: () => shareAsPDF(cloud)
        },
        {
          text: 'Share as Image',
          onPress: () => shareAsImage(cloud)
        }
      ]
    );
  };

  const shareInfo = async (cloud: PointCloud) => {
    try {
      const shareContent = {
        title: `3D Scan: ${cloud.name}`,
        message:
          `Check out this 3D scan: ${cloud.name}\n\n` +
          `📊 Statistics:\n` +
          `• Points: ${cloud.metadata.pointCount.toLocaleString()}\n` +
          `• Duration: ${formatDuration(cloud.metadata.scanDuration)}\n` +
          `• Device: ${cloud.metadata.deviceType}\n` +
          `• Date: ${formatTimestamp(cloud.timestamp)}\n\n` +
          `Scanned with 3D Scanner Foundation App`,
        url: `https://3dscanner.app/scan/${cloud.id}`
      };

      await Share.share(shareContent, {
        dialogTitle: `Share ${cloud.name}`
      });
    } catch (error) {
      console.error('Error sharing info:', error);
      Alert.alert('Error', 'Failed to share point cloud info');
    }
  };

  const shareAsPLY = async (cloud: PointCloud) => {
    try {
      const plyContent = generatePLYContent(cloud);
      const shareContent = {
        title: `${cloud.name}.ply`,
        message: `PLY Point Cloud: ${cloud.name}`,
        url: `data:text/plain;base64,${btoa(plyContent)}`
      };

      await Share.share(shareContent);
    } catch (error) {
      console.error('Error sharing PLY:', error);
      Alert.alert('Error', 'Failed to share PLY file');
    }
  };

  const shareAsJSON = async (cloud: PointCloud) => {
    try {
      const jsonContent = JSON.stringify(cloud, null, 2);
      const shareContent = {
        title: `${cloud.name}.json`,
        message: `JSON Data: ${cloud.name}`,
        url: `data:application/json;base64,${btoa(jsonContent)}`
      };

      await Share.share(shareContent);
    } catch (error) {
      console.error('Error sharing JSON:', error);
      Alert.alert('Error', 'Failed to share JSON file');
    }
  };

  const shareAsPDF = async (cloud: PointCloud) => {
    try {
      const pdfContent = generatePDFReport(cloud);
      const shareContent = {
        title: `${cloud.name}_Report.pdf`,
        message: `PDF Report: ${cloud.name}`,
        url: `data:application/pdf;base64,${btoa(pdfContent)}`
      };

      await Share.share(shareContent);
    } catch (error) {
      console.error('Error sharing PDF:', error);
      Alert.alert('Error', 'Failed to share PDF file');
    }
  };

  const shareAsImage = async (cloud: PointCloud) => {
    try {
      const svgContent = generateSVGContent(cloud);
      const shareContent = {
        title: `${cloud.name}.svg`,
        message: `SVG Image: ${cloud.name}`,
        url: `data:image/svg+xml;base64,${btoa(svgContent)}`
      };

      await Share.share(shareContent);
    } catch (error) {
      console.error('Error sharing image:', error);
      Alert.alert('Error', 'Failed to share image file');
    }
  };

  const handleExport = async (cloud: PointCloud) => {
    Alert.alert(
      'Export Point Cloud',
      `Choose export format for "${cloud.name}"`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: '3D Formats',
          onPress: () => show3DFormatOptions(cloud)
        },
        {
          text: '2D Formats',
          onPress: () => show2DFormatOptions(cloud)
        },
        {
          text: 'Document Formats',
          onPress: () => showDocumentFormatOptions(cloud)
        },
        {
          text: 'JSON Data',
          onPress: () => exportAsJSON(cloud)
        }
      ]
    );
  };

  const show3DFormatOptions = (cloud: PointCloud) => {
    Alert.alert('3D Export Formats', 'Choose 3D file format:', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'PLY (Point Cloud)', onPress: () => exportAsPLY(cloud) },
      { text: 'OBJ (Mesh)', onPress: () => exportAsOBJ(cloud) },
      { text: 'STL (3D Print)', onPress: () => exportAsSTL(cloud) },
      { text: 'GLTF (Web 3D)', onPress: () => exportAsGLTF(cloud) },
      { text: 'XYZ (Simple)', onPress: () => exportAsXYZ(cloud) }
    ]);
  };

  const show2DFormatOptions = (cloud: PointCloud) => {
    Alert.alert('2D Export Formats', 'Choose 2D image format:', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'PNG (High Quality)', onPress: () => exportAsPNG(cloud) },
      { text: 'JPEG (Compressed)', onPress: () => exportAsJPEG(cloud) },
      { text: 'SVG (Vector)', onPress: () => exportAsSVG(cloud) },
      { text: 'PDF (Document)', onPress: () => exportAsPDF(cloud) }
    ]);
  };

  const showDocumentFormatOptions = (cloud: PointCloud) => {
    Alert.alert('Document Export Formats', 'Choose document format:', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'PDF Report', onPress: () => exportAsPDFReport(cloud) },
      { text: 'DOCX Report', onPress: () => exportAsDOCX(cloud) },
      { text: 'CSV Data', onPress: () => exportAsCSV(cloud) },
      { text: 'TXT Summary', onPress: () => exportAsTXT(cloud) }
    ]);
  };

  const exportAsPLY = async (cloud: PointCloud) => {
    try {
      const plyContent = generatePLYContent(cloud);
      console.log(
        'PLY content generated:',
        plyContent.substring(0, 200) + '...'
      );

      // In a real app, save to file and share
      const shareContent = {
        title: `${cloud.name}.ply`,
        message: `PLY Point Cloud: ${cloud.name}`,
        url: `data:text/plain;base64,${btoa(plyContent)}`
      };

      await Share.share(shareContent);
      Alert.alert('Success', 'PLY file exported and shared!');
    } catch (error) {
      console.error('Error exporting PLY:', error);
      Alert.alert('Error', 'Failed to export PLY file');
    }
  };

  const exportAsOBJ = async (cloud: PointCloud) => {
    try {
      const objContent = generateOBJContent(cloud);
      console.log('OBJ content generated');

      const shareContent = {
        title: `${cloud.name}.obj`,
        message: `OBJ 3D Model: ${cloud.name}`,
        url: `data:text/plain;base64,${btoa(objContent)}`
      };

      await Share.share(shareContent);
      Alert.alert('Success', 'OBJ file exported and shared!');
    } catch (error) {
      console.error('Error exporting OBJ:', error);
      Alert.alert('Error', 'Failed to export OBJ file');
    }
  };

  const exportAsSTL = async (cloud: PointCloud) => {
    try {
      const stlContent = generateSTLContent(cloud);
      console.log('STL content generated');

      const shareContent = {
        title: `${cloud.name}.stl`,
        message: `STL 3D Model: ${cloud.name}`,
        url: `data:text/plain;base64,${btoa(stlContent)}`
      };

      await Share.share(shareContent);
      Alert.alert('Success', 'STL file exported and shared!');
    } catch (error) {
      console.error('Error exporting STL:', error);
      Alert.alert('Error', 'Failed to export STL file');
    }
  };

  const exportAsGLTF = async (cloud: PointCloud) => {
    try {
      const gltfContent = generateGLTFContent(cloud);
      console.log('GLTF content generated');

      const shareContent = {
        title: `${cloud.name}.gltf`,
        message: `GLTF 3D Model: ${cloud.name}`,
        url: `data:application/json;base64,${btoa(gltfContent)}`
      };

      await Share.share(shareContent);
      Alert.alert('Success', 'GLTF file exported and shared!');
    } catch (error) {
      console.error('Error exporting GLTF:', error);
      Alert.alert('Error', 'Failed to export GLTF file');
    }
  };

  const exportAsXYZ = async (cloud: PointCloud) => {
    try {
      const xyzContent = generateXYZContent(cloud);
      console.log('XYZ content generated');

      const shareContent = {
        title: `${cloud.name}.xyz`,
        message: `XYZ Point Cloud: ${cloud.name}`,
        url: `data:text/plain;base64,${btoa(xyzContent)}`
      };

      await Share.share(shareContent);
      Alert.alert('Success', 'XYZ file exported and shared!');
    } catch (error) {
      console.error('Error exporting XYZ:', error);
      Alert.alert('Error', 'Failed to export XYZ file');
    }
  };

  const exportAsPNG = async (cloud: PointCloud) => {
    try {
      console.log('PNG export requested');
      // In a real app, capture screenshot of 3D view
      const shareContent = {
        title: `${cloud.name}.png`,
        message: `PNG Image: ${cloud.name}`,
        url: `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==`
      };

      await Share.share(shareContent);
      Alert.alert('Success', 'PNG image exported and shared!');
    } catch (error) {
      console.error('Error exporting PNG:', error);
      Alert.alert('Error', 'Failed to export PNG image');
    }
  };

  const exportAsJPEG = async (cloud: PointCloud) => {
    try {
      console.log('JPEG export requested');
      const shareContent = {
        title: `${cloud.name}.jpg`,
        message: `JPEG Image: ${cloud.name}`,
        url: `data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxAAPwCdABmX/9k=`
      };

      await Share.share(shareContent);
      Alert.alert('Success', 'JPEG image exported and shared!');
    } catch (error) {
      console.error('Error exporting JPEG:', error);
      Alert.alert('Error', 'Failed to export JPEG image');
    }
  };

  const exportAsSVG = async (cloud: PointCloud) => {
    try {
      const svgContent = generateSVGContent(cloud);
      console.log('SVG content generated');

      const shareContent = {
        title: `${cloud.name}.svg`,
        message: `SVG Vector: ${cloud.name}`,
        url: `data:image/svg+xml;base64,${btoa(svgContent)}`
      };

      await Share.share(shareContent);
      Alert.alert('Success', 'SVG file exported and shared!');
    } catch (error) {
      console.error('Error exporting SVG:', error);
      Alert.alert('Error', 'Failed to export SVG file');
    }
  };

  const exportAsPDF = async (cloud: PointCloud) => {
    try {
      const pdfContent = generatePDFContent(cloud);
      console.log('PDF content generated');

      const shareContent = {
        title: `${cloud.name}.pdf`,
        message: `PDF Document: ${cloud.name}`,
        url: `data:application/pdf;base64,${btoa(pdfContent)}`
      };

      await Share.share(shareContent);
      Alert.alert('Success', 'PDF file exported and shared!');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      Alert.alert('Error', 'Failed to export PDF file');
    }
  };

  const exportAsPDFReport = async (cloud: PointCloud) => {
    try {
      const pdfReport = generatePDFReport(cloud);
      console.log('PDF report generated');

      const shareContent = {
        title: `${cloud.name}_Report.pdf`,
        message: `PDF Report: ${cloud.name}`,
        url: `data:application/pdf;base64,${btoa(pdfReport)}`
      };

      await Share.share(shareContent);
      Alert.alert('Success', 'PDF report exported and shared!');
    } catch (error) {
      console.error('Error exporting PDF report:', error);
      Alert.alert('Error', 'Failed to export PDF report');
    }
  };

  const exportAsDOCX = async (cloud: PointCloud) => {
    try {
      const docxContent = generateDOCXContent(cloud);
      console.log('DOCX content generated');

      const shareContent = {
        title: `${cloud.name}_Report.docx`,
        message: `DOCX Report: ${cloud.name}`,
        url: `data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,${btoa(
          docxContent
        )}`
      };

      await Share.share(shareContent);
      Alert.alert('Success', 'DOCX report exported and shared!');
    } catch (error) {
      console.error('Error exporting DOCX:', error);
      Alert.alert('Error', 'Failed to export DOCX file');
    }
  };

  const exportAsCSV = async (cloud: PointCloud) => {
    try {
      const csvContent = generateCSVContent(cloud);
      console.log('CSV content generated');

      const shareContent = {
        title: `${cloud.name}.csv`,
        message: `CSV Data: ${cloud.name}`,
        url: `data:text/csv;base64,${btoa(csvContent)}`
      };

      await Share.share(shareContent);
      Alert.alert('Success', 'CSV file exported and shared!');
    } catch (error) {
      console.error('Error exporting CSV:', error);
      Alert.alert('Error', 'Failed to export CSV file');
    }
  };

  const exportAsTXT = async (cloud: PointCloud) => {
    try {
      const txtContent = generateTXTContent(cloud);
      console.log('TXT content generated');

      const shareContent = {
        title: `${cloud.name}.txt`,
        message: `TXT Summary: ${cloud.name}`,
        url: `data:text/plain;base64,${btoa(txtContent)}`
      };

      await Share.share(shareContent);
      Alert.alert('Success', 'TXT file exported and shared!');
    } catch (error) {
      console.error('Error exporting TXT:', error);
      Alert.alert('Error', 'Failed to export TXT file');
    }
  };

  const exportAsJSON = async (cloud: PointCloud) => {
    try {
      const jsonContent = JSON.stringify(cloud, null, 2);
      console.log('JSON content generated');

      const shareContent = {
        title: `${cloud.name}.json`,
        message: `JSON Data: ${cloud.name}`,
        url: `data:application/json;base64,${btoa(jsonContent)}`
      };

      await Share.share(shareContent);
      Alert.alert('Success', 'JSON file exported and shared!');
    } catch (error) {
      console.error('Error exporting JSON:', error);
      Alert.alert('Error', 'Failed to export JSON file');
    }
  };

  const generatePLYContent = (cloud: PointCloud): string => {
    const header = `ply
format ascii 1.0
element vertex ${cloud.points.length}
property float x
property float y
property float z
property uchar red
property uchar green
property uchar blue
end_header
`;

    const points = cloud.points
      .map((point) => {
        const r = Math.floor((point.x + 1) * 127.5);
        const g = Math.floor((point.y + 1) * 127.5);
        const b = Math.floor((point.z + 1) * 127.5);
        return `${point.x} ${point.y} ${point.z} ${r} ${g} ${b}`;
      })
      .join('\n');

    return header + points;
  };

  const generateOBJContent = (cloud: PointCloud): string => {
    const vertices = cloud.points
      .map((point) => `v ${point.x} ${point.y} ${point.z}`)
      .join('\n');
    const points = cloud.points.map((_, index) => `p ${index + 1}`).join('\n');
    return `# OBJ file generated from point cloud: ${cloud.name}\n${vertices}\n${points}`;
  };

  const generateSTLContent = (cloud: PointCloud): string => {
    const header = `solid ${cloud.name}\n`;
    const triangles = cloud.points
      .map((point, i) => {
        if (i % 3 === 0 && i + 2 < cloud.points.length) {
          const p1 = cloud.points[i];
          const p2 = cloud.points[i + 1];
          const p3 = cloud.points[i + 2];
          return `  facet normal 0 0 0\n    outer loop\n      vertex ${p1.x} ${p1.y} ${p1.z}\n      vertex ${p2.x} ${p2.y} ${p2.z}\n      vertex ${p3.x} ${p3.y} ${p3.z}\n    endloop\n  endfacet`;
        }
        return '';
      })
      .filter((t) => t)
      .join('\n');
    return header + triangles + '\nendsolid';
  };

  const generateGLTFContent = (cloud: PointCloud): string => {
    const positions = cloud.points.flatMap((p) => [p.x, p.y, p.z]);
    const colors = cloud.points.flatMap((p) => [
      (p.x + 1) / 2,
      (p.y + 1) / 2,
      (p.z + 1) / 2
    ]);

    return JSON.stringify(
      {
        asset: { version: '2.0' },
        scene: 0,
        scenes: [{ nodes: [0] }],
        nodes: [{ mesh: 0 }],
        meshes: [
          {
            primitives: [
              {
                attributes: {
                  POSITION: 1,
                  COLOR_0: 2
                },
                mode: 0
              }
            ]
          }
        ],
        bufferViews: [
          {
            buffer: 0,
            byteOffset: 0,
            byteLength: positions.length * 4,
            target: 34962
          },
          {
            buffer: 0,
            byteOffset: positions.length * 4,
            byteLength: colors.length * 4,
            target: 34962
          }
        ],
        accessors: [
          {
            bufferView: 0,
            componentType: 5126,
            count: cloud.points.length,
            type: 'VEC3',
            max: [
              Math.max(...cloud.points.map((p) => p.x)),
              Math.max(...cloud.points.map((p) => p.y)),
              Math.max(...cloud.points.map((p) => p.z))
            ],
            min: [
              Math.min(...cloud.points.map((p) => p.x)),
              Math.min(...cloud.points.map((p) => p.y)),
              Math.min(...cloud.points.map((p) => p.z))
            ]
          },
          {
            bufferView: 1,
            componentType: 5126,
            count: cloud.points.length,
            type: 'VEC3'
          }
        ],
        buffers: [
          {
            byteLength: (positions.length + colors.length) * 4,
            uri:
              'data:application/octet-stream;base64,' +
              btoa(
                String.fromCharCode(
                  ...new Uint8Array(
                    new Float32Array([...positions, ...colors]).buffer
                  )
                )
              )
          }
        ]
      },
      null,
      2
    );
  };

  const generateXYZContent = (cloud: PointCloud): string => {
    return cloud.points
      .map((point) => `${point.x} ${point.y} ${point.z}`)
      .join('\n');
  };

  const generatePDFContent = (cloud: PointCloud): string => {
    // Simple PDF content - in a real app, use a PDF library
    return `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length 100
>>
stream
BT
/F1 12 Tf
72 720 Td
(${cloud.name}) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000204 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
350
%%EOF`;
  };

  const generatePDFReport = (cloud: PointCloud): string => {
    const report = `
3D Scan Report: ${cloud.name}

Scan Information:
- Date: ${formatTimestamp(cloud.timestamp)}
- Device: ${cloud.metadata.deviceType}
- Duration: ${formatDuration(cloud.metadata.scanDuration)}
- Point Count: ${cloud.metadata.pointCount.toLocaleString()}

Bounding Box:
- Width: ${(
      cloud.metadata.boundingBox.max.x - cloud.metadata.boundingBox.min.x
    ).toFixed(2)}m
- Height: ${(
      cloud.metadata.boundingBox.max.y - cloud.metadata.boundingBox.min.y
    ).toFixed(2)}m
- Depth: ${(
      cloud.metadata.boundingBox.max.z - cloud.metadata.boundingBox.min.z
    ).toFixed(2)}m

Generated by 3D Scanner Foundation App
    `.trim();

    return generatePDFContent(cloud) + report;
  };

  const generateDOCXContent = (cloud: PointCloud): string => {
    // Simple DOCX content - in a real app, use a DOCX library
    return `PK
    word/document.xml
    <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
    <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
      <w:body>
        <w:p>
          <w:r>
            <w:t>3D Scan Report: ${cloud.name}</w:t>
          </w:r>
        </w:p>
        <w:p>
          <w:r>
            <w:t>Point Count: ${cloud.metadata.pointCount.toLocaleString()}</w:t>
          </w:r>
        </w:p>
      </w:body>
    </w:document>
    PK`;
  };

  const generateCSVContent = (cloud: PointCloud): string => {
    const header = 'X,Y,Z,Color\n';
    const points = cloud.points
      .map((point) => {
        const color = Math.floor(((point.x + point.y + point.z) / 3) * 255);
        return `${point.x},${point.y},${point.z},${color}`;
      })
      .join('\n');
    return header + points;
  };

  const generateTXTContent = (cloud: PointCloud): string => {
    return `3D Scan Summary: ${cloud.name}

Scan Details:
- Date: ${formatTimestamp(cloud.timestamp)}
- Device: ${cloud.metadata.deviceType}
- Duration: ${formatDuration(cloud.metadata.scanDuration)}
- Total Points: ${cloud.metadata.pointCount.toLocaleString()}

Dimensions:
- Width: ${(
      cloud.metadata.boundingBox.max.x - cloud.metadata.boundingBox.min.x
    ).toFixed(2)}m
- Height: ${(
      cloud.metadata.boundingBox.max.y - cloud.metadata.boundingBox.min.y
    ).toFixed(2)}m
- Depth: ${(
      cloud.metadata.boundingBox.max.z - cloud.metadata.boundingBox.min.z
    ).toFixed(2)}m

Point Cloud Data:
${cloud.points
  .slice(0, 10)
  .map(
    (p, i) =>
      `Point ${i + 1}: (${p.x.toFixed(3)}, ${p.y.toFixed(3)}, ${p.z.toFixed(
        3
      )})`
  )
  .join('\n')}
${
  cloud.points.length > 10
    ? `... and ${cloud.points.length - 10} more points`
    : ''
}

Generated by 3D Scanner Foundation App`;
  };

  const generateSVGContent = (cloud: PointCloud): string => {
    const width = 800;
    const height = 600;
    const points = cloud.points
      .map((point) => {
        const x = ((point.x + 1) / 2) * width;
        const y = ((point.y + 1) / 2) * height;
        return `<circle cx="${x}" cy="${y}" r="2" fill="rgb(${Math.floor(
          (point.x + 1) * 127.5
        )}, ${Math.floor((point.y + 1) * 127.5)}, ${Math.floor(
          (point.z + 1) * 127.5
        )})" />`;
      })
      .join('\n  ');

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <title>${cloud.name}</title>
  <rect width="100%" height="100%" fill="black"/>
  ${points}
</svg>`;
  };

  const closeViewer = () => {
    setIsViewing(false);
    setSelectedCloud(null);
  };

  const toggleViewMode = () => {
    setViewMode(viewMode === '3d' ? '2d' : '3d');
  };

  const handleDelete = (cloud: PointCloud) => {
    Alert.alert(
      'Delete Point Cloud',
      `Are you sure you want to delete "${cloud.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            StorageService.deletePointCloud(cloud.id)
              .then(() => {
                setPointClouds((prev) =>
                  prev.filter((pc) => pc.id !== cloud.id)
                );
                Alert.alert('Success', 'Point cloud deleted successfully!');
              })
              .catch((error) => {
                console.error('Failed to delete point cloud:', error);
                Alert.alert('Error', 'Failed to delete point cloud.');
              });
          }
        }
      ]
    );
  };

  const PointCloudCard: React.FC<{ cloud: PointCloud }> = ({ cloud }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{cloud.name}</Text>
        <Text style={styles.cardTimestamp}>
          {formatTimestamp(cloud.timestamp)}
        </Text>
      </View>

      <View style={styles.cardStats}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Points</Text>
          <Text style={styles.statValue}>
            {cloud.metadata.pointCount.toLocaleString()}
          </Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Duration</Text>
          <Text style={styles.statValue}>
            {formatDuration(cloud.metadata.scanDuration)}
          </Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Device</Text>
          <Text style={styles.statValue}>{cloud.metadata.deviceType}</Text>
        </View>
      </View>

      <View style={styles.cardActions}>
        <Button
          title='View'
          onPress={() => handleView(cloud)}
          variant='primary'
          size='small'
          icon={<Eye size={16} color={SCANNER_CONSTANTS.COLORS.BACKGROUND} />}
          style={styles.actionButton}
        />
        <Button
          title='Export'
          onPress={() => handleExport(cloud)}
          variant='outline'
          size='small'
          icon={<Download size={16} color={SCANNER_CONSTANTS.COLORS.PRIMARY} />}
          style={styles.actionButton}
        />
        <Button
          title='Share'
          onPress={() => handleShare(cloud)}
          variant='ghost'
          size='small'
          icon={
            <ShareIcon
              size={16}
              color={SCANNER_CONSTANTS.COLORS.TEXT_PRIMARY}
            />
          }
          style={styles.actionButton}
        />
        <Button
          title=''
          onPress={() => handleDelete(cloud)}
          variant='ghost'
          size='small'
          icon={<Trash2 size={16} color={SCANNER_CONSTANTS.COLORS.ERROR} />}
          style={[styles.actionButton, styles.deleteButton]}
        />
      </View>
    </View>
  );

  const ViewerModal = () => (
    <Modal
      visible={isViewing}
      animationType='slide'
      presentationStyle='fullScreen'
    >
      <View style={styles.modalContainer}>
        <StatusBar style='light' />

        {/* Header */}
        <View style={styles.modalHeader}>
          <View style={styles.modalHeaderContent}>
            <View>
              <Text style={styles.modalTitle}>{selectedCloud?.name}</Text>
              <Text style={styles.modalSubtitle}>
                {viewMode === '3d' ? '3D View' : '2D View'} •{' '}
                {selectedCloud?.metadata.pointCount.toLocaleString()} points
              </Text>
            </View>

            <View style={styles.modalHeaderActions}>
              <Button
                title=''
                onPress={toggleViewMode}
                variant='ghost'
                size='small'
                icon={
                  viewMode === '3d' ? (
                    <Grid3X3
                      size={20}
                      color={SCANNER_CONSTANTS.COLORS.TEXT_PRIMARY}
                    />
                  ) : (
                    <Box
                      size={20}
                      color={SCANNER_CONSTANTS.COLORS.TEXT_PRIMARY}
                    />
                  )
                }
                style={styles.viewModeButton}
              />
              <Button
                title=''
                onPress={() => selectedCloud && handleShare(selectedCloud)}
                variant='ghost'
                size='small'
                icon={
                  <ShareIcon
                    size={20}
                    color={SCANNER_CONSTANTS.COLORS.TEXT_PRIMARY}
                  />
                }
                style={styles.shareButton}
              />
              <Button
                title=''
                onPress={closeViewer}
                variant='ghost'
                size='small'
                icon={
                  <EyeOff
                    size={20}
                    color={SCANNER_CONSTANTS.COLORS.TEXT_PRIMARY}
                  />
                }
                style={styles.closeButton}
              />
            </View>
          </View>
        </View>

        {/* Content */}
        <View style={styles.modalContent}>
          {viewMode === '3d' ? (
            selectedCloud ? (
              <PointCloudViewer
                pointCloud={selectedCloud}
                onClose={closeViewer}
              />
            ) : (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>No Point Cloud Selected</Text>
                <Text style={styles.errorMessage}>
                  Please select a point cloud to view in 3D
                </Text>
              </View>
            )
          ) : (
            <View style={styles.twoDView}>
              <View style={styles.twoDHeader}>
                <Text style={styles.twoDTitle}>2D Projection View</Text>
                <Text style={styles.twoDSubtitle}>
                  Top-down view of the point cloud
                </Text>
              </View>

              <View style={styles.twoDCanvas}>
                <View style={styles.twoDPlaceholder}>
                  <ImageIcon
                    size={64}
                    color={SCANNER_CONSTANTS.COLORS.TEXT_SECONDARY}
                  />
                  <Text style={styles.twoDPlaceholderText}>
                    2D Projection View
                  </Text>
                  <Text style={styles.twoDPlaceholderSubtext}>
                    In a full implementation, this would show a 2D projection of
                    the point cloud
                  </Text>
                </View>
              </View>

              <View style={styles.twoDStats}>
                <View style={styles.twoDStat}>
                  <Text style={styles.twoDStatLabel}>Width</Text>
                  <Text style={styles.twoDStatValue}>
                    {(
                      (selectedCloud?.metadata.boundingBox.max.x || 0) -
                      (selectedCloud?.metadata.boundingBox.min.x || 0)
                    ).toFixed(2)}
                    m
                  </Text>
                </View>
                <View style={styles.twoDStat}>
                  <Text style={styles.twoDStatLabel}>Height</Text>
                  <Text style={styles.twoDStatValue}>
                    {(
                      (selectedCloud?.metadata.boundingBox.max.y || 0) -
                      (selectedCloud?.metadata.boundingBox.min.y || 0)
                    ).toFixed(2)}
                    m
                  </Text>
                </View>
                <View style={styles.twoDStat}>
                  <Text style={styles.twoDStatLabel}>Depth</Text>
                  <Text style={styles.twoDStatValue}>
                    {(
                      (selectedCloud?.metadata.boundingBox.max.z || 0) -
                      (selectedCloud?.metadata.boundingBox.min.z || 0)
                    ).toFixed(2)}
                    m
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <StatusBar style='light' />

      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>3D Point Clouds</Text>
            <Text style={styles.headerSubtitle}>
              {pointClouds.length} scanned objects
            </Text>
          </View>
          <Button
            title=''
            onPress={handleRefresh}
            variant='ghost'
            size='small'
            icon={
              <RefreshCw
                size={20}
                color={SCANNER_CONSTANTS.COLORS.TEXT_PRIMARY}
              />
            }
            style={styles.refreshButton}
          />
          <Button
            title='Test'
            onPress={handleTestCreatePointCloud}
            variant='outline'
            size='small'
            style={styles.testButton}
          />
          <Button
            title='Test 3D'
            onPress={handleTest3DViewer}
            variant='outline'
            size='small'
            style={styles.testButton}
          />
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingState}>
          <RefreshCw
            size={48}
            color={SCANNER_CONSTANTS.COLORS.TEXT_SECONDARY}
          />
          <Text style={styles.loadingText}>Loading point clouds...</Text>
        </View>
      ) : pointClouds.length === 0 ? (
        <View style={styles.emptyState}>
          <EyeOff size={64} color={SCANNER_CONSTANTS.COLORS.TEXT_SECONDARY} />
          <Text style={styles.emptyTitle}>No Point Clouds</Text>
          <Text style={styles.emptyText}>
            Start scanning objects to see them here
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {pointClouds.map((cloud) => (
            <PointCloudCard key={cloud.id} cloud={cloud} />
          ))}
        </ScrollView>
      )}

      <ViewerModal />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SCANNER_CONSTANTS.COLORS.BACKGROUND
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)'
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: SCANNER_CONSTANTS.COLORS.TEXT_PRIMARY,
    marginBottom: 4
  },
  headerSubtitle: {
    fontSize: 16,
    color: SCANNER_CONSTANTS.COLORS.TEXT_SECONDARY
  },
  refreshButton: {
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  testButton: {
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  scrollView: {
    flex: 1
  },
  scrollContent: {
    padding: 20,
    gap: 16
  },
  card: {
    backgroundColor: SCANNER_CONSTANTS.COLORS.SURFACE,
    borderRadius: SCANNER_CONSTANTS.UI.BORDER_RADIUS,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)'
  },
  cardHeader: {
    marginBottom: 16
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: SCANNER_CONSTANTS.COLORS.TEXT_PRIMARY,
    marginBottom: 4
  },
  cardTimestamp: {
    fontSize: 14,
    color: SCANNER_CONSTANTS.COLORS.TEXT_SECONDARY
  },
  cardStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20
  },
  stat: {
    alignItems: 'center'
  },
  statLabel: {
    fontSize: 12,
    color: SCANNER_CONSTANTS.COLORS.TEXT_SECONDARY,
    marginBottom: 4
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: SCANNER_CONSTANTS.COLORS.TEXT_PRIMARY
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8
  },
  actionButton: {
    flex: 1
  },
  deleteButton: {
    flex: 0,
    minWidth: 44
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: SCANNER_CONSTANTS.COLORS.TEXT_PRIMARY,
    marginTop: 20,
    marginBottom: 8
  },
  emptyText: {
    fontSize: 16,
    color: SCANNER_CONSTANTS.COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 24
  },
  loadingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40
  },
  loadingText: {
    fontSize: 18,
    color: SCANNER_CONSTANTS.COLORS.TEXT_SECONDARY,
    marginTop: 10
  },
  modalContainer: {
    flex: 1,
    backgroundColor: SCANNER_CONSTANTS.COLORS.BACKGROUND
  },
  modalHeader: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)'
  },
  modalHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: SCANNER_CONSTANTS.COLORS.TEXT_PRIMARY,
    marginBottom: 4
  },
  modalSubtitle: {
    fontSize: 16,
    color: SCANNER_CONSTANTS.COLORS.TEXT_SECONDARY
  },
  modalHeaderActions: {
    flexDirection: 'row',
    gap: 8
  },
  viewModeButton: {
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  shareButton: {
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  closeButton: {
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  modalContent: {
    flex: 1,
    padding: 20
  },
  twoDView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: SCANNER_CONSTANTS.COLORS.SURFACE
  },
  twoDHeader: {
    alignItems: 'center',
    marginBottom: 20
  },
  twoDTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: SCANNER_CONSTANTS.COLORS.TEXT_PRIMARY,
    marginBottom: 4
  },
  twoDSubtitle: {
    fontSize: 16,
    color: SCANNER_CONSTANTS.COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 24
  },
  twoDCanvas: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: SCANNER_CONSTANTS.COLORS.SURFACE,
    borderRadius: SCANNER_CONSTANTS.UI.BORDER_RADIUS,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)'
  },
  twoDPlaceholder: {
    alignItems: 'center',
    padding: 20
  },
  twoDPlaceholderText: {
    fontSize: 20,
    fontWeight: '600',
    color: SCANNER_CONSTANTS.COLORS.TEXT_PRIMARY,
    marginTop: 10,
    marginBottom: 4
  },
  twoDPlaceholderSubtext: {
    fontSize: 14,
    color: SCANNER_CONSTANTS.COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 20
  },
  twoDStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    paddingHorizontal: 20
  },
  twoDStat: {
    alignItems: 'center'
  },
  twoDStatLabel: {
    fontSize: 12,
    color: SCANNER_CONSTANTS.COLORS.TEXT_SECONDARY,
    marginBottom: 4
  },
  twoDStatValue: {
    fontSize: 16,
    fontWeight: '600',
    color: SCANNER_CONSTANTS.COLORS.TEXT_PRIMARY
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: SCANNER_CONSTANTS.COLORS.SURFACE,
    borderRadius: 10,
    margin: 20
  },
  errorText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: SCANNER_CONSTANTS.COLORS.TEXT_PRIMARY,
    marginBottom: 10
  },
  errorMessage: {
    fontSize: 14,
    color: SCANNER_CONSTANTS.COLORS.TEXT_SECONDARY,
    textAlign: 'center'
  }
});
