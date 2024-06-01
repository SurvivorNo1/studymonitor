import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Modal, Table, Input, Pagination, Select } from 'antd';

const { Option } = Select;
const { Search } = Input;

interface FilePreviewProps {
  file: File;
}

const FilePreview: React.FC<FilePreviewProps> = ({ file }) => {
  const [data, setData] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [searchText, setSearchText] = useState<string>('');

  useEffect(() => {
    const readExcel = async (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const binaryStr = e.target?.result;
        const workbook = XLSX.read(binaryStr, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet);
        const processedData = jsonData.map((item, index) => ({ ...item, key: index.toString() }));
        setData(processedData);
        setFilteredData(processedData);
      };
      reader.readAsArrayBuffer(file);
    };

    readExcel(file);
  }, [file]);

  useEffect(() => {
    const filtered = data.filter((item) =>
      Object.values(item).some((val) =>
        String(val).toLowerCase().includes(searchText.toLowerCase())
      )
    );
    setFilteredData(filtered);
  }, [searchText, data]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleRowsPerPageChange = (value: number) => {
    setRowsPerPage(value);
    setCurrentPage(1); // Reset to first page when rows per page change
  };

  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filteredData.slice(indexOfFirstRow, indexOfLastRow);

  const columns = data.length > 0 ? Object.keys(data[0]).map(key => ({
    title: key,
    dataIndex: key,
    key,
  })) : [];

  return (
    <div>
      <button onClick={() => setIsModalOpen(true)}>预览 {file.name}</button>
      <Modal
        title="Excel Preview"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width="80%"
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <Search
            placeholder="Search..."
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: '300px' }}
          />
          <div style={{ fontSize: '16px', fontWeight: 500 }}>总数: {filteredData.length}</div>
        </div>
        <Table
          dataSource={currentRows}
          columns={columns}
          pagination={false}
          rowKey="key" // 使用添加的唯一字段作为键
          scroll={{ x: 'max-content' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
          <Pagination
            current={currentPage}
            total={filteredData.length}
            pageSize={rowsPerPage}
            onChange={handlePageChange}
          />
          <Select value={rowsPerPage} onChange={handleRowsPerPageChange} style={{ width: 120 }}>
            <Option value={5}>5</Option>
            <Option value={10}>10</Option>
            <Option value={20}>20</Option>
            <Option value={50}>50</Option>
            <Option value={100}>100</Option>
          </Select>
        </div>
      </Modal>
    </div>
  );
};

export default FilePreview;
