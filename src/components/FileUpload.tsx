import React, { useState } from 'react';
import { Upload, Button } from 'antd';
import { UploadOutlined } from '@ant-design/icons';

interface FileUploadProps {
  onFileUpload: (file: File) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload }) => {
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFileChange = (info: any) => {
    if (info.fileList.length > 0) {
      const file = info.fileList[0].originFileObj;
      setFileName(file.name); // 设置文件名
      onFileUpload(file);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <Upload
        accept=".xlsx"
        beforeUpload={() => false} // Prevent automatic upload
        onChange={handleFileChange}
        showUploadList={false} // Hide the upload list
      >
        <Button icon={<UploadOutlined />}>点击上传'花名册'</Button>
      </Upload>
      {fileName && <span style={{ marginLeft: '10px' }}>{fileName}</span>}
    </div>
  );
};

export default FileUpload;
