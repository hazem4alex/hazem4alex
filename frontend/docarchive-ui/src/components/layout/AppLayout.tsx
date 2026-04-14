import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Button, Avatar, Dropdown, Space, Typography, Modal, Form, Input, message, Drawer, Grid } from 'antd';
import {
  FileTextOutlined,
  FolderOutlined,
  UserOutlined,
  PlusOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  KeyOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import { changeOwnPassword } from '../../api/users';
import LanguageSwitcher from './LanguageSwitcher';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const NAVY    = '#0D1B2A';
const AMBER   = '#C9973A';

const sectionLabels: Record<string, { en: string; ar: string }> = {
  '/documents':     { en: 'Documents', ar: 'الوثائق' },
  '/documents/add': { en: 'New Document', ar: 'وثيقة جديدة' },
  '/categories':    { en: 'Categories', ar: 'التصنيفات' },
  '/users':         { en: 'User Management', ar: 'إدارة المستخدمين' },
};

export default function AppLayout() {
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAdmin, isManager } = useAuthStore();
  const [changePwdOpen, setChangePwdOpen] = useState(false);
  const [pwdForm] = Form.useForm();
  const [pwdLoading, setPwdLoading] = useState(false);

  const screens = Grid.useBreakpoint();
  // md = true when >= 768px; false when < 768px; undefined before first measurement
  const isMobile = screens.md === false;

  const language = localStorage.getItem('docarchive-lang') || 'ar';
  const isRtl = language === 'ar';

  const handleChangePassword = async (values: { newPassword: string; confirmPassword: string }) => {
    if (values.newPassword !== values.confirmPassword) {
      pwdForm.setFields([{ name: 'confirmPassword', errors: [t('users.passwordMismatch')] }]);
      return;
    }
    if (!user) return;
    setPwdLoading(true);
    try {
      await changeOwnPassword(values.newPassword);
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
    { key: '/documents',     icon: <FileTextOutlined />, label: t('nav.documents') },
    { key: '/documents/add', icon: <PlusOutlined />,     label: t('nav.addDocument') },
    ...(isManager() ? [{ key: '/categories', icon: <FolderOutlined />, label: t('nav.categories') }] : []),
    ...(isAdmin()   ? [{ key: '/users',       icon: <UserOutlined />,  label: t('nav.users') }]       : []),
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

  const displayName = isRtl ? user?.fullName_AR : user?.fullName_EN;
  const baseKey = '/' + location.pathname.split('/')[1];
  const section = sectionLabels[location.pathname] ?? sectionLabels[baseKey];
  const sectionLabel = section ? (isRtl ? section.ar : section.en) : '';

  // Sidebar inner content — shared between Sider (desktop) and Drawer (mobile)
  const renderSidebarContent = (alwaysExpanded = false) => {
    const showText = alwaysExpanded || !collapsed;
    return (
      <>
        {/* subtle diagonal grid pattern */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.04,
          backgroundImage: 'repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)',
          backgroundSize: '18px 18px',
          pointerEvents: 'none',
        }} />

        {/* Logo / Brand */}
        <div style={{
          padding: showText ? '22px 20px' : '20px 0',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          justifyContent: showText ? 'flex-start' : 'center',
        }}>
          <div style={{
            width: 34, height: 34, borderRadius: 6,
            background: `linear-gradient(135deg, ${AMBER} 0%, #A07828 100%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <SafetyCertificateOutlined style={{ color: '#fff', fontSize: 18 }} />
          </div>
          {showText && (
            <div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 15, lineHeight: 1.2, fontFamily: "'EB Garamond', serif", letterSpacing: '0.02em' }}>
                {isRtl ? 'نظام الأرشفة' : 'DocArchive'}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                {isRtl ? 'نظام إدارة الوثائق' : 'Records Management'}
              </div>
            </div>
          )}
        </div>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          inlineCollapsed={alwaysExpanded ? false : collapsed}
          onClick={({ key }) => {
            navigate(key);
            if (isMobile) setDrawerOpen(false);
          }}
          style={{
            marginTop: 8,
            background: 'transparent',
            border: 'none',
          }}
        />

        {/* Role badge at bottom */}
        {showText && user && (
          <div style={{
            position: 'absolute', bottom: 16, left: 16, right: 16,
            padding: '8px 12px',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: 6,
            border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 2 }}>
              {isRtl ? 'الصلاحية' : 'Role'}
            </div>
            <div style={{ color: AMBER, fontSize: 12, fontWeight: 600 }}>
              {t(`users.roles.${user.role}`)}
            </div>
          </div>
        )}
      </>
    );
  };

  return (
    <Layout style={{ minHeight: '100vh', direction: isRtl ? 'rtl' : 'ltr' }}>
      {/* ── Sidebar: Desktop ────────────────────────────── */}
      {!isMobile && (
        <Sider
          collapsible
          collapsed={collapsed}
          trigger={null}
          width={230}
          collapsedWidth={64}
          style={{
            background: NAVY,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {renderSidebarContent()}
        </Sider>
      )}

      {/* ── Sidebar: Mobile Drawer ───────────────────────── */}
      <Drawer
        open={isMobile && drawerOpen}
        onClose={() => setDrawerOpen(false)}
        placement={isRtl ? 'right' : 'left'}
        width={230}
        closeIcon={false}
        styles={{
          body: { padding: 0, background: NAVY, position: 'relative', overflow: 'hidden' },
        }}
      >
        {renderSidebarContent(true)}
      </Drawer>

      <Layout style={{ background: 'var(--vault-surface)' }}>
        {/* ── Header ──────────────────────────────────────── */}
        <Header style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#ffffff',
          borderBottom: '1px solid var(--vault-border)',
          padding: isMobile ? '0 12px' : '0 20px',
          height: 56,
          boxShadow: '0 1px 4px rgba(13,27,42,0.06)',
        }}>
          <Space size={isMobile ? 8 : 16}>
            <Button
              type="text"
              icon={
                isMobile
                  ? <MenuUnfoldOutlined style={{ fontSize: 16, color: NAVY }} />
                  : collapsed
                    ? <MenuUnfoldOutlined style={{ fontSize: 16, color: NAVY }} />
                    : <MenuFoldOutlined   style={{ fontSize: 16, color: NAVY }} />
              }
              onClick={() => isMobile ? setDrawerOpen(true) : setCollapsed(!collapsed)}
              style={{ width: 36, height: 36, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            />
            {sectionLabel && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 3, height: 18, background: AMBER, borderRadius: 2, flexShrink: 0 }} />
                <span style={{
                  fontSize: isMobile ? 13 : 15,
                  fontWeight: 600,
                  color: NAVY,
                  fontFamily: "'EB Garamond', serif",
                  letterSpacing: '0.01em',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: isMobile ? 120 : 'none',
                }}>
                  {sectionLabel}
                </span>
              </div>
            )}
          </Space>

          <Space size={isMobile ? 6 : 12} align="center">
            <LanguageSwitcher />
            <div style={{ width: 1, height: 24, background: 'var(--vault-border)' }} />
            <Dropdown menu={{ items: userMenu }} placement={isRtl ? 'bottomLeft' : 'bottomRight'} trigger={['click']}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: isMobile ? 0 : 10,
                cursor: 'pointer',
                padding: isMobile ? '6px' : '6px 10px',
                borderRadius: 6,
                transition: 'background 0.15s',
              }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--vault-surface)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <Avatar
                  style={{
                    background: `linear-gradient(135deg, ${NAVY} 0%, #1E2E42 100%)`,
                    fontSize: 13,
                    fontWeight: 600,
                    flexShrink: 0,
                  }}
                  size={32}
                >
                  {displayName?.charAt(0).toUpperCase()}
                </Avatar>
                {!isMobile && (
                  <div style={{ lineHeight: 1.3 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: NAVY, whiteSpace: 'nowrap' }}>
                      {displayName}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--vault-muted)' }}>
                      {t(`users.roles.${user?.role}`)}
                    </div>
                  </div>
                )}
              </div>
            </Dropdown>
          </Space>
        </Header>

        {/* ── Content ─────────────────────────────────────── */}
        <Content style={{
          margin: isMobile ? '8px' : '20px',
          padding: isMobile ? '16px 12px' : '24px',
          background: '#ffffff',
          borderRadius: isMobile ? 6 : 8,
          minHeight: 280,
          border: '1px solid var(--vault-border)',
        }}>
          <Outlet />
        </Content>
      </Layout>

      {/* ── Change Password Modal ────────────────────────── */}
      <Modal
        open={changePwdOpen}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <KeyOutlined style={{ color: AMBER }} />
            <span style={{ fontFamily: "'EB Garamond', serif", fontSize: 18 }}>{t('users.changePassword')}</span>
          </div>
        }
        onCancel={() => { setChangePwdOpen(false); pwdForm.resetFields(); }}
        onOk={() => pwdForm.submit()}
        okText={t('common.save')}
        cancelText={t('common.cancel')}
        confirmLoading={pwdLoading}
        destroyOnClose
      >
        <Form form={pwdForm} layout="vertical" onFinish={handleChangePassword}>
          <Form.Item name="newPassword" label={t('users.newPassword')} rules={[{ required: true, message: t('common.required') }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item name="confirmPassword" label={t('users.confirmPassword')} rules={[{ required: true, message: t('common.required') }]}>
            <Input.Password />
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
}
