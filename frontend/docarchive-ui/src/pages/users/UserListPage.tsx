import { useEffect, useState } from 'react';
import { Table, Button, Space, Tag, Popconfirm, Typography, message, Modal, Form, Input, Tree, Alert } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, KeyOutlined, SafetyOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getUsers, deleteUser, changeUserPassword, getUserCategories, setUserCategories } from '../../api/users';
import { getCategoryTree } from '../../api/categories';
import { useSettingsStore } from '../../store/settingsStore';

const { Title } = Typography;

interface CategoryNode {
  id: number;
  name_AR: string;
  name_EN: string;
  children: CategoryNode[];
}

function buildTreeData(nodes: CategoryNode[], language: string): any[] {
  return nodes.map((n) => ({
    key: n.id,
    title: language === 'ar' ? n.name_AR : n.name_EN,
    children: buildTreeData(n.children, language),
  }));
}

function collectAllKeys(nodes: CategoryNode[]): number[] {
  return nodes.flatMap((n) => [n.id, ...collectAllKeys(n.children)]);
}

export default function UserListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const language = useSettingsStore((s) => s.language);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Change password modal
  const [changePwdUser, setChangePwdUser] = useState<{ id: number; username: string } | null>(null);
  const [pwdForm] = Form.useForm();
  const [pwdLoading, setPwdLoading] = useState(false);

  // Category access modal
  const [accessUser, setAccessUser] = useState<{ id: number; username: string; role: string } | null>(null);
  const [categoryTree, setCategoryTree] = useState<CategoryNode[]>([]);
  const [checkedKeys, setCheckedKeys] = useState<number[]>([]);
  const [accessLoading, setAccessLoading] = useState(false);
  const [accessSaving, setAccessSaving] = useState(false);

  const load = () => {
    setLoading(true);
    getUsers().then(setUsers).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: number) => {
    try {
      await deleteUser(id);
      message.success(t('common.success'));
      load();
    } catch {
      message.error(t('common.error'));
    }
  };

  const handleChangePassword = async (values: { newPassword: string; confirmPassword: string }) => {
    if (values.newPassword !== values.confirmPassword) {
      pwdForm.setFields([{ name: 'confirmPassword', errors: [t('users.passwordMismatch')] }]);
      return;
    }
    if (!changePwdUser) return;
    setPwdLoading(true);
    try {
      await changeUserPassword(changePwdUser.id, values.newPassword);
      message.success(t('common.success'));
      setChangePwdUser(null);
      pwdForm.resetFields();
    } catch {
      message.error(t('common.error'));
    } finally {
      setPwdLoading(false);
    }
  };

  const openAccessModal = async (user: { id: number; username: string; role: string }) => {
    setAccessUser(user);
    setAccessLoading(true);
    try {
      const [tree, assigned] = await Promise.all([getCategoryTree(), getUserCategories(user.id)]);
      setCategoryTree(tree);
      setCheckedKeys(assigned);
    } catch {
      message.error(t('common.error'));
    } finally {
      setAccessLoading(false);
    }
  };

  const handleSaveAccess = async () => {
    if (!accessUser) return;
    setAccessSaving(true);
    try {
      await setUserCategories(accessUser.id, checkedKeys);
      message.success(t('common.success'));
      setAccessUser(null);
    } catch {
      message.error(t('common.error'));
    } finally {
      setAccessSaving(false);
    }
  };

  const treeData = buildTreeData(categoryTree, language);

  const columns = [
    { title: t('users.username'), dataIndex: 'username', key: 'username' },
    {
      title: language === 'ar' ? t('users.fullNameAR') : t('users.fullNameEN'),
      key: 'fullName',
      render: (_: any, r: any) => language === 'ar' ? r.fullName_AR : r.fullName_EN,
    },
    {
      title: t('users.role'),
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => <Tag color="blue">{t(`users.roles.${role}`)}</Tag>,
    },
    {
      title: t('common.status'),
      dataIndex: 'isActive',
      key: 'isActive',
      render: (v: boolean) => <Tag color={v ? 'green' : 'red'}>{v ? t('common.active') : t('common.inactive')}</Tag>,
    },
    {
      title: t('common.actions'),
      key: 'actions',
      render: (_: any, r: any) => (
        <Space>
          <Button icon={<EditOutlined />} size="small" onClick={() => navigate(`/users/${r.id}/edit`)} />
          <Button
            icon={<KeyOutlined />}
            size="small"
            onClick={() => { setChangePwdUser({ id: r.id, username: r.username }); pwdForm.resetFields(); }}
          />
          {/* Only User-role users need category access management */}
          {r.role === 'User' && (
            <Button
              icon={<SafetyOutlined />}
              size="small"
              onClick={() => openAccessModal({ id: r.id, username: r.username, role: r.role })}
            />
          )}
          <Popconfirm title={t('users.deleteConfirm')} onConfirm={() => handleDelete(r.id)}>
            <Button icon={<DeleteOutlined />} size="small" danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <Title level={4} style={{ margin: 0 }}>{t('users.title')}</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/users/new')}>
          {t('users.addUser')}
        </Button>
      </div>
      <Table rowKey="id" columns={columns} dataSource={users} loading={loading} scroll={{ x: 600 }} />

      {/* Change Password Modal */}
      <Modal
        open={Boolean(changePwdUser)}
        title={`${t('users.changePassword')} — ${changePwdUser?.username}`}
        onCancel={() => { setChangePwdUser(null); pwdForm.resetFields(); }}
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

      {/* Category Access Modal */}
      <Modal
        open={Boolean(accessUser)}
        title={`${t('users.categoryAccess')} — ${accessUser?.username}`}
        onCancel={() => setAccessUser(null)}
        onOk={handleSaveAccess}
        okText={t('common.save')}
        cancelText={t('common.cancel')}
        confirmLoading={accessSaving}
        width={480}
        destroyOnClose
      >
        {checkedKeys.length === 0 && !accessLoading && (
          <Alert
            message={t('users.noAccessCategories')}
            type="warning"
            showIcon
            style={{ marginBottom: 12 }}
          />
        )}
        <Tree
          checkable
          treeData={treeData}
          checkedKeys={checkedKeys}
          onCheck={(checked) => {
            const keys = Array.isArray(checked) ? checked : checked.checked;
            setCheckedKeys(keys as number[]);
          }}
          defaultExpandAll
          style={{ maxHeight: 400, overflowY: 'auto' }}
        />
      </Modal>
    </>
  );
}
