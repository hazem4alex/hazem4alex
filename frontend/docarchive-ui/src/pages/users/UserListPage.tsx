import { useEffect, useState } from 'react';
import { Table, Button, Space, Tag, Popconfirm, Typography, message, Modal, Form, Input } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, KeyOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getUsers, deleteUser, changeUserPassword } from '../../api/users';
import { useSettingsStore } from '../../store/settingsStore';

const { Title } = Typography;

export default function UserListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const language = useSettingsStore((s) => s.language);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [changePwdUser, setChangePwdUser] = useState<{ id: number; username: string } | null>(null);
  const [pwdForm] = Form.useForm();
  const [pwdLoading, setPwdLoading] = useState(false);

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
          <Popconfirm title={t('users.deleteConfirm')} onConfirm={() => handleDelete(r.id)}>
            <Button icon={<DeleteOutlined />} size="small" danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>{t('users.title')}</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/users/new')}>
          {t('users.addUser')}
        </Button>
      </div>
      <Table rowKey="id" columns={columns} dataSource={users} loading={loading} />

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
    </>
  );
}
