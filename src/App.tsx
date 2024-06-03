import React, { useState, useEffect } from 'react';
import FileUpload from './components/FileUpload';
import FilePreview from './components/FilePreview';
import CompareResult from './components/CompareResult';
import { compareExcels } from './services/excelHandler';
import { StageData, OrganizationData } from './services/types';
import { fetchCompleteLists, fetchCombinedData } from './services/api';
import { Input, Spin, Table, Button, Modal, Form, Typography, Layout, Row, Col } from 'antd';
import { GithubOutlined } from '@ant-design/icons';

const { Search } = Input;
const { Title, Paragraph } = Typography;
const { Header, Content } = Layout;

const App: React.FC = () => {
  const [username, setUsername] = useState(localStorage.getItem('username') || '');
  const [password, setPassword] = useState(localStorage.getItem('password') || '');
  const [sid, setSid] = useState<string>(localStorage.getItem('sid') || '');
  const [orgids, setOrgids] = useState<string[]>(localStorage.getItem('orgids') ? JSON.parse(localStorage.getItem('orgids')!) : []);
  const [totalListFile, setTotalListFile] = useState<File | null>(null);
  const [completeLists, setCompleteLists] = useState<File[]>([]);
  const [unmatchedList, setUnmatchedList] = useState<any[]>([]);
  const [stageData, setStageData] = useState<StageData[]>([]);
  const [organizationData, setOrganizationData] = useState<OrganizationData[]>([]);
  const [filteredOrganizationData, setFilteredOrganizationData] = useState<OrganizationData[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isHelpModalVisible, setIsHelpModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [_orgNames, setOrgNames] = useState<string[]>([]);

  useEffect(() => {
    setUsername(localStorage.getItem('username') || '');
    setPassword(localStorage.getItem('password') || '');
    setSid(localStorage.getItem('sid') || '');
    setOrgids(localStorage.getItem('orgids') ? JSON.parse(localStorage.getItem('orgids')!) : []);
  }, []);

  useEffect(() => {
    localStorage.setItem('username', username);
    localStorage.setItem('password', password);
    localStorage.setItem('sid', sid);
    localStorage.setItem('orgids', JSON.stringify(orgids));
  }, [username, password, sid, orgids]);

  useEffect(() => {
    setFilteredOrganizationData(
      organizationData.filter((data) =>
        data.orgName.toLowerCase().includes(searchText.toLowerCase())
      )
    );
  }, [searchText, organizationData]);

  const handleFetchLists = async () => {
    if (!username || !password || !sid || orgids.length === 0) {
      alert('Please enter username, password, and select a sid and orgid(s) first.');
      return;
    }
    setLoading(true);
    try {
      const token = sessionStorage.getItem('token');
      if (!token) {
        throw new Error('Please log in first!');
      }
      const lists = await fetchCompleteLists(parseInt(sid), orgids.map(id => parseInt(id)),token);
      setCompleteLists(lists);
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error fetching complete lists:', error);
        alert('An error occurred while fetching complete lists: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCompare = async () => {
    if (!totalListFile || completeLists.length === 0) {
      alert('Please upload a total list file and fetch complete lists first.');
      return;
    }

    if (totalListFile && completeLists.length > 0) {
      const unmatched = await compareExcels(totalListFile, completeLists);
      setUnmatchedList(unmatched);
    }
  };

  const handleLogin = () => {
    const fetchData = async () => {
      const { organizationData, stageData } = await fetchCombinedData(username, password);
      setStageData(stageData);
      setOrganizationData(organizationData.sort((a, b) => a.orgId - b.orgId));
    };
    fetchData();
  };

  const handleOpenModal = () => {
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
  };

  const handleHelpModalOpen = () => {
    setIsHelpModalVisible(true);
  };

  const handleHelpModalClose = () => {
    setIsHelpModalVisible(false);
  };

  const handleSelectChange = (selectedRowKeys: React.Key[], selectedRows: OrganizationData[]) => {
    setOrgids(selectedRowKeys as string[]);
    setOrgNames(selectedRows.map(row => row.orgName));
  };

  const rowSelection = {
    selectedRowKeys: orgids,
    onChange: handleSelectChange,
  };

  const columns = [
    {
      title: 'Orgid',
      dataIndex: 'orgId',
    },
    {
      title: 'Org Name',
      dataIndex: 'orgName',
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh', padding: '20px' }}>
      <Header style={{ backgroundColor: '#fff', borderBottom: '1px solid #e8e8e8', marginBottom: '10px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '8px', padding: '0 20px' }}>
        <div style={{ flex: 1 }}>
          {/* 空的 div 用于占位，使中间部分居中 */}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 2 }}>
          <Title level={2} style={{ margin: 0 }}>Study Monitor</Title>
          <a href="https://github.com/SurvivorNo1/studymonitor" target="_blank" rel="noopener noreferrer" style={{ marginLeft: '5px' }}>
            <GithubOutlined style={{ fontSize: '24px' }} />
          </a>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', flex: 1 }}>
          <Button type="link" onClick={handleHelpModalOpen}>使用说明</Button>
        </div>
      </Header>
      <Content>
        <Row gutter={20} justify="space-between">
          <Col xs={24} md={8}>
            <div style={{ padding: '20px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}>
              <Title level={3}>输入</Title>
              <Form layout="vertical">
                <Form.Item label="Username">
                  <Input value={username} onChange={(e) => setUsername(e.target.value)} />
                </Form.Item>
                <Form.Item label="Password">
                  <Input.Password value={password} onChange={(e) => setPassword(e.target.value)} />
                </Form.Item>
                <Form.Item>
                  <Button type="primary" onClick={handleLogin} block>登录</Button>
                </Form.Item>
                <Form.Item label="已选期数(Sid):">
                  <p>{sid}</p>
                  <select value={sid} onChange={(e) => setSid(e.target.value)} style={{ width: '100%', marginTop: '8px' }}>
                    <option value="">选择期数...</option>
                    {stageData.map((data) => (
                      <option key={data.id} value={data.id.toString()}>
                        {data.snum + "(sid:" + data.id + ")"}
                      </option>
                    ))}
                  </select>
                </Form.Item>
                <Form.Item label="已选组织列表(Orgids):">
                  <div>
                    {orgids.map((sid, index) => {
                      const org = organizationData.find(data => data.orgId === parseInt(sid));
                      return (
                        <p key={index}>
                          组织名: {org ? org.orgName : ''}
                        </p>
                      );
                    })}
                  </div>
                  <Button onClick={handleOpenModal}>选择组织列表Orgids</Button>
                  <Modal title="选择组织Orgid" open={isModalVisible} onOk={handleCloseModal} onCancel={handleCloseModal}>
                    <Search
                      placeholder="Search..."
                      onChange={(e) => setSearchText(e.target.value)}
                      style={{ marginBottom: 16 }}
                    />
                    <Table
                      dataSource={filteredOrganizationData}
                      columns={columns}
                      rowKey="orgId"
                      pagination={{ pageSize: 10, pageSizeOptions: ['10', '15', '20'] }}
                      rowSelection={rowSelection}
                    />
                  </Modal>
                </Form.Item>
                <Form.Item>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Button type="primary" onClick={handleFetchLists} disabled={loading} block>获取'已选组织'学习情况</Button>
                    {loading && <Spin style={{ marginLeft: '10px' }} />}
                  </div>
                </Form.Item>
                <Form.Item>
                  <FileUpload onFileUpload={setTotalListFile} />
                </Form.Item>
                <Form.Item>
                  <Button type="primary" onClick={handleCompare} disabled={loading} block>对比</Button>
                </Form.Item>
                {totalListFile && <FilePreview file={totalListFile} />}
                {completeLists.length > 0 && (
                  <>
                    {completeLists.map((file, index) => (
                      <FilePreview key={index} file={file} />
                    ))}
                  </>
                )}
              </Form>
            </div>
          </Col>
          <Col xs={24} md={16}>
            <div style={{ padding: '20px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}>
              <Title level={3}>输出</Title>
              <CompareResult unmatchedList={unmatchedList} sid={sid} orgids={orgids} />
            </div>
          </Col>
        </Row>
      </Content>
      <Modal title="使用说明" open={isHelpModalVisible} onOk={handleHelpModalClose} onCancel={handleHelpModalClose}>
      <Title level={4}>简介</Title>
    <Paragraph>
      虽然不明显，但这是一个监控QNDXX的工具，旨在帮助核对组织成员的大学习完成情况。通过输入用户信息、选择期数和组织，用户可以获取组织的学习情况，并上传自己的花名册进行核对。最终，用户可以预览和下载对比结果。
    </Paragraph>
      <Paragraph>
      <strong>注意事项和免责声明</strong>
      <br />
      - 基于爬虫，所以请节制使用，以免账号被封，本工具不对任何使用后果负责。
      <br />
      - 上传的花名册文件应为'.xlsx'格式，文件格式至少含'姓名''组织名称'两列。
      <br />
      - 只测试过swjtu的scyol网址下的查询哈,这是一个pure的前端项目，不会上传任何数据到服务器，放心使用。
    </Paragraph>
    <Title level={5}>使用步骤</Title>
    <Paragraph>
      <strong>1. 输入信息</strong>
      <br />
      - 输入用户名、密码。然后点击“登录”。
    </Paragraph>
    <Paragraph>
      <strong>2. 选择组织</strong>
      <br />
      - 登录后才会有组织和期数，然后选择期数、组织。
    </Paragraph>
    <Paragraph>
      <strong>3. 获取学习情况</strong>
      <br />
      - 点击“获取'已选组织'学习情况”。可在下方预览获取的表格
    </Paragraph>
    <Paragraph>
      <strong>4. 上传花名册</strong>
      <br />
      - 上传.xlsx文件(excel表格)。可在下方预览上传的表格
    </Paragraph>
    <Paragraph>
      <strong>5. 核对学习情况</strong>
      <br />
      - 点击“对比”。
    </Paragraph>
    <Paragraph>
      <strong>6. 查看和下载结果</strong>
      <br />
      - 预览、下载结果。
    </Paragraph>
      </Modal>
    </Layout>
  );
};

export default App;
