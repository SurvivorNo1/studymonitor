import React, { useState, useEffect } from 'react';
import FileUpload from './components/FileUpload';
import FilePreview from './components/FilePreview';
import CompareResult from './components/CompareResult';
import { compareExcels } from './services/excelHandler';
import { StageData, OrganizationData } from './services/types';
import { fetchCompleteLists, fetchCombinedData } from './services/api';
import { Input, Spin, Table, Button, Modal, Form, Typography, Layout, Row, Col } from 'antd';

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
  const [orgNames, setOrgNames] = useState<string[]>([]);

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
    const fetchData = async () => {
      const { organizationData, stageData } = await fetchCombinedData(username, password);
      setStageData(stageData);
      setOrganizationData(organizationData.sort((a, b) => a.orgId - b.orgId));
    };
    fetchData();
  }, [username, password]);

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
      const lists = await fetchCompleteLists(username, password, parseInt(sid), orgids.map(id => parseInt(id)));
      setCompleteLists(lists);
    } catch (error) {
      console.error('Error fetching complete lists:', error);
      alert('An error occurred while fetching complete lists.');
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

  const handleSelectChange = (selectedRowKeys: React.SetStateAction<string[]>, selectedRows: { map: (arg0: (row: { orgName: any; }) => any) => React.SetStateAction<never[]>; }) => {
    setOrgids(selectedRowKeys);
    setOrgNames(selectedRows.map((row: { orgName: any; }) => row.orgName));
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
      <Header style={{ backgroundColor: '#fff', borderBottom: '1px solid #e8e8e8', marginBottom: '10px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '8px' }}>
        <Title level={2} style={{ textAlign: 'center', margin: 0, width: '100%' }}>Study Monitor</Title>
        <Button type="link" onClick={handleHelpModalOpen} style={{ position: 'absolute', right: '20px' }}>使用说明</Button>
      </Header>
      <Content >
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
                <Form.Item label="已选组织列表(Orgids):" >
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
                  <Button type="primary" onClick={handleCompare} disabled={loading} block>对比'已选组织'与'花名册'</Button>
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
          本应用是一个 Excel 比较工具，旨在帮助用户核对组织成员的学习时间和完成情况。通过输入用户信息、选择期数和组织，用户可以获取组织的学习情况，并上传自己的花名册进行核对。最终，用户可以预览和下载对比结果。
        </Paragraph>
        <Title level={5}>使用步骤</Title>
        <Paragraph>
          <strong>1. 输入用户信息</strong>
          <br />
          - 用户名 (Username)：在“输入”面板中，找到“Username”字段，输入您的用户名。
          <br />
          - 密码 (Password)：在“输入”面板中，找到“Password”字段，输入您的密码。
        </Paragraph>
        <Paragraph>
          <strong>2. 查看所属组织</strong>
          <br />
          - 期数 (Sid)：在“输入”面板中，找到“已选期数Sid”字段。点击下拉菜单，选择您所需的期数。期数的格式为 `snum (sid: id)`，例如 `2024 (sid: 1)`。
          <br />
          - 选择组织 (Orgid)：在“输入”面板中，找到“已选组织Orgid”字段。点击“Select Orgid”按钮，打开选择组织的模态框。在模态框中，您可以通过搜索框快速查找组织。勾选您需要核对的组织。点击“Ok”按钮确认选择。
        </Paragraph>
        <Paragraph>
          <strong>3. 获取组织的学习情况</strong>
          <br />
          - 获取列表 (Fetch Lists)：在“输入”面板中，确认已输入用户名、密码，并选择了期数和组织。点击“Fetch Lists”按钮，获取所选组织的学习情况。如果获取过程中出现错误，系统会提示您相关信息。
        </Paragraph>
        <Paragraph>
          <strong>4. 上传花名册</strong>
          <br />
          - 上传文件 (Upload File)：在“输入”面板中，找到文件上传组件。点击上传区域，选择您准备的花名册文件。上传成功后，您可以在页面上预览上传的文件。
        </Paragraph>
        <Paragraph>
          <strong>5. 核对学习情况</strong>
          <br />
          - 对比 (Compare)：在“输入”面板中，确认已上传花名册文件，并获取了组织的学习情况。点击“Compare”按钮，系统会根据获取的组织和花名册中的人员信息，核对学习时间和完成情况。核对结果会显示在“输出”面板中。
        </Paragraph>
        <Paragraph>
          <strong>6. 预览和下载对比结果</strong>
          <br />
          - 预览结果：在“输出”面板中，您可以查看核对后的结果列表。未匹配的列表会显示在页面上，方便您进行进一步处理。
          <br />
          - 下载结果：在“输出”面板中，找到下载按钮，点击即可下载对比结果文件。
        </Paragraph>
        <Paragraph>
          <strong>注意事项</strong>
          <br />
          - 请确保输入的用户名和密码正确，以便成功获取组织的学习情况。
          <br />
          - 上传的花名册文件应为 Excel 格式，确保文件内容格式正确，以便系统进行有效核对。
          <br />
          - 核对过程中，请耐心等待，系统会处理并显示结果。
        </Paragraph>
      </Modal>
      </Layout>
  );
};

export default App;
