import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Table, Select, Button, Input } from 'antd';

interface CompareResultProps {
  unmatchedList: any[];
  sid: string;
  orgids: string[];
}

const { Option } = Select;
const { Search } = Input;

const CompareResult: React.FC<CompareResultProps> = ({ unmatchedList, sid, orgids }) => {
  const [displayMode, setDisplayMode] = useState<'all' | 'unlearned' | 'learned'>('all');
  const [searchText, setSearchText] = useState<string>('');

  const handleDownload = () => {
    const worksheet = XLSX.utils.json_to_sheet(unmatchedList);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    const orgidsStr = orgids.join('_');
    const fileName = `UnmatchedList_sid_${sid}_orgids_${orgidsStr}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const filteredList = unmatchedList.filter(record => {
    if (displayMode === 'unlearned') {
      return record['学习时间'] === '未学习';
    } else if (displayMode === 'learned') {
      return record['学习时间'] !== '未学习';
    } else {
      return true;
    }
  }).filter(record => {
    if (!searchText) return true;
    return Object.values(record).some(value => value.toString().toLowerCase().includes(searchText.toLowerCase()));
  });

  const columns = filteredList.length > 0 ? Object.keys(filteredList[0]).map(key => ({ title: key, dataIndex: key })) : [];

  return (
    <div>
      <h3>比对结果</h3>
      <div style={{ marginBottom: '10px' }}>
        <label htmlFor="displayModeSelect" style={{ marginRight: '5px' }}>显示方式 : </label>
        <Select
          id="displayModeSelect"
          value={displayMode}
          onChange={(value) => setDisplayMode(value as 'all' | 'unlearned' | 'learned')}
          style={{ width: '80px' }}
        >
          <Option value="all">全部</Option>
          <Option value="unlearned">未学习</Option>
          <Option value="learned">已学习</Option>
        </Select>
        <Search
          placeholder="输入关键字进行搜索"
          allowClear
          onSearch={(value) => setSearchText(value)}
          style={{ width: 200, marginLeft: '20px' }}
        />
        <Button type="primary" onClick={handleDownload} style={{ marginLeft: '20px' }}>下载表格</Button>
      </div>
      <Table
        dataSource={filteredList}
        columns={columns}
        pagination={{ pageSize: 10 }}
        scroll={{ x: true }}
        bordered
        rowKey={(record, index) => index.toString()} // 使用索引作为唯一键
      />
    </div>
  );
};

export default CompareResult;
