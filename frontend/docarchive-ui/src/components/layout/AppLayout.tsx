import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Button, Avatar, Dropdown, Space, Typography } from 'antd';
import {
  FileTextOutlined,
  FolderOutlined,
  UserOutlined,
  PlusOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import LanguageSwitcher from './LanguageSwitcher';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

export default function AppLayout() {
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAdmin } = useAuthStore();

  const lang = useAuthStore((s) => s.user);
  const language = localStorage.getItem('docarchive-lang') || 'ar';

  const menuItems = [
    { key: '/documents', icon: <FileTextOutlined />, label: t('nav.documents') },
    { key: '/documents/add', icon: <PlusOutlined />, label: t('nav.addDocument') },
    { key: '/categories', icon: <FolderOutlined />, label: t('nav.categories') },
    ...(isAdmin() ? [{ key: '/users', icon: <UserOutlined />, label: t('nav.users') }] : []),
  ];

  const userMenu = [
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
    </Layout>
  );
}
