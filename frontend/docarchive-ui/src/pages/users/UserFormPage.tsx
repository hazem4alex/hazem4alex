import { useEffect, useState } from 'react';
import { Form, Input, Select, Switch, Button, Card, Typography, message, Space } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getUser, createUser, updateUser } from '../../api/users';

const { Title } = Typography;

export default function UserFormPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const isEdit = Boolean(id);

  useEffect(() => {
    if (isEdit) {
      getUser(Number(id)).then((data) => {
        form.setFieldsValue({ ...data, password: '' });
      });
    }
  }, [id]);

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      if (isEdit) {
        await updateUser(Number(id), values);
      } else {
        await createUser(values);
      }
      message.success(t('common.success'));
      navigate('/users');
    } catch {
      message.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card style={{ maxWidth: 600, margin: '0 auto' }}>
      <Title level={4}>{isEdit ? t('users.editUser') : t('users.addUser')}</Title>
      <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ role: 'User', isActive: true }}>
        <Form.Item name="username" label={t('users.username')} rules={[{ required: !isEdit }]}>
          <Input disabled={isEdit} />
        </Form.Item>
        <Form.Item name="password" label={t('users.password')} extra={isEdit ? t('users.passwordHint') : undefined}>
          <Input.Password />
        </Form.Item>
        <Form.Item name="fullName_AR" label={t('users.fullNameAR')} rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="fullName_EN" label={t('users.fullNameEN')} rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="role" label={t('users.role')}>
          <Select options={['Admin', 'Manager', 'User'].map((r) => ({ value: r, label: t(`users.roles.${r}`) }))} />
        </Form.Item>
        <Form.Item name="isActive" label={t('common.status')} valuePropName="checked">
          <Switch checkedChildren={t('common.active')} unCheckedChildren={t('common.inactive')} />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={loading}>{t('common.save')}</Button>
            <Button onClick={() => navigate('/users')}>{t('common.cancel')}</Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
}
