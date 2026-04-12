import { useEffect, useState } from 'react';
import { Table, Button, Space, Tag, Popconfirm, Typography, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getUsers, deleteUser } from '../../api/users';
import { useSettingsStore } from '../../store/settingsStore';

const { Title } = Typography;

export default function UserListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const language = useSettingsStore((s) => s.language);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
    </>
  );
}
