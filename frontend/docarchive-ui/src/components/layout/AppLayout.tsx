import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Button, Avatar, Dropdown, Space, Typography, Modal, Form, Input, message } from 'antd';
import {
  FileTextOutlined,
  FolderOutlined,
  UserOutlined,
  PlusOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  KeyOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import { changeUserPassword } from '../../api/users';
import LanguageSwitcher from './LanguageSwitcher';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

export default function AppLayout() {
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAdmin } = useAuthStore();
  const [changePwdOpen, setChangePwdOpen] = useState(false);
  const [pwdForm] = Form.useForm();
  const [pwdLoading, setPwdLoading] = useState(false);

  const language = localStorage.getItem('docarchive-lang') || 'ar';

  const handleChangePassword = async (values: { newPassword: string; confirmPassword: string }) => {
    if (values.newPassword !== values.confirmPassword) {
      pwdForm.setFields([{ name: 'confirmPassword', errors: [t('users.passwordMismatch')] }]);
      return;
    }
    if (!user) return;
    setPwdLoading(true);
    try {
      await changeUserPassword(user.userId, values.newPassword);
      message.success(t('common.success'));
      setChangePwdOpen(false);
      pwdForm.resetFields();
    } catch {
      message.error(t('common.error'));
    } finally {
      setPwdLoading(false);
    }
  };

  const menuItems = [
    { key: '/documents', icon: <FileTextOutlined />, label: t('nav.documents') },
    { key: '/documents/add', icon: <PlusOutlined />, label: t('nav.addDocument') },
    { key: '/categories', icon: <FolderOutlined />, label: t('nav.categories') },
    ...(isAdmin() ? [{ key: '/users', icon: <UserOutlined />, label: t('nav.users') }] : []),
  ];

  const userMenu = [
    {
      key: 'changePassword',
      icon: <KeyOutlined />,
      label: t('users.changePassword'),
      onClick: () => { pwdForm.resetFields(); setChangePwdOpen(true); },
    },
    { type: 'divider' as const },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: t('auth.logout'),
      onClick: () => { logout(); navigate('/login'); },
    },
  ];

  const displayName = language === 'ar' ? user?.fullName_AR : user?.fullName_EN;

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        trigger={null}
        width={220}
        style={{ background: '#001529' }}
      >
        <div style={{ padding: '16px', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          {!collapsed && (
            <Text style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>
              {language === 'ar' ? 'نظام الأرشفة' : 'DocArchive'}
            </Text>
          )}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ marginTop: 8 }}
        />
      </Sider>

      <Layout>
        <Header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#fff',
            borderBottom: '1px solid #f0f0f0',
            padding: '0 16px',
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
          />

          <Space>
            <LanguageSwitcher />
            <Dropdown menu={{ items: userMenu }} placement="bottomRight">
              <Space style={{ cursor: 'pointer' }}>
                <Avatar icon={<UserOutlined />} style={{ background: '#1677ff' }} />
                <Text>{displayName}</Text>
              </Space>
            </Dropdown>
          </Space>
        </Header>

        <Content style={{ margin: 16, padding: 24, background: '#fff', borderRadius: 8, minHeight: 280 }}>
          <Outlet />
        </Content>
      </Layout>

      <Modal
        open={changePwdOpen}
        title={t('users.changePassword')}
        onCancel={() => { setChangePwdOpen(false); pwdForm.resetFields(); }}
        onOk={() => pwdForm.submit()}
        okText={t('common.save')}
        cancelText={t('common.cancel')}
        confirmLoading={pwdLoading}
        destroyOnClose
      >
        <Form form={pwdForm} layout="vertical" onFinish={handleChangePassword}>
          <Form.Item
            name="newPassword"
            label={t('users.newPassword')}
            rules={[{ required: true, message: t('common.required') }]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label={t('users.confirmPassword')}
            rules={[{ required: true, message: t('common.required') }]}
          >
            <Input.Password />
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
}
