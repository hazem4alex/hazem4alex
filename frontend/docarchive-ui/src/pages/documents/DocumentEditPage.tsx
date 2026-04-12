import { useEffect, useState } from 'react';
import { Form, Input, Button, Card, Typography, Space, Select, Divider, message, Spin } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getDocument, updateDocument } from '../../api/documents';
import { getCategory } from '../../api/categories';
import { useSettingsStore } from '../../store/settingsStore';
import DynamicFormField from '../../components/common/DynamicFormField';
import FileUploadArea from '../../components/common/FileUploadArea';
import dayjs from 'dayjs';

const { Title } = Typography;

export default function DocumentEditPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const language = useSettingsStore((s) => s.language);
  const [form] = Form.useForm();
  const [doc, setDoc] = useState<any>(null);
  const [category, setCategory] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getDocument(Number(id)).then(async (data) => {
      setDoc(data);
      const cat = await getCategory(data.categoryId);
      setCategory(cat);

      const fieldValues: Record<string, any> = {};
      data.fieldValues.forEach((fv: any) => {
        const field = cat.fields.find((f: any) => f.id === fv.fieldId);
        if (!field) return;
        let val: any = fv.value;
        if ((field.fieldType === 'date' || field.fieldType === 'datetime') && val) {
          val = dayjs(val);
        } else if (field.fieldType === 'number' && val !== null) {
          val = Number(val);
        }
        fieldValues[String(fv.fieldId)] = val;
      });
      form.setFieldsValue({ title: data.title, status: data.status, fieldValues });
    });
  }, [id]);

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const fieldValues = Object.entries(values.fieldValues ?? {}).map(([fieldId, value]) => ({
        fieldId: Number(fieldId),
        value: value === null || value === undefined ? null : String(value),
      }));
      await updateDocument(Number(id), { title: values.title, status: values.status, fieldValues });
      message.success(t('common.success'));
      navigate(`/documents/${id}`);
    } catch {
      message.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  if (!doc || !category) return <Spin />;

  return (
    <Card style={{ maxWidth: 800, margin: '0 auto' }}>
      <Title level={4}>{t('documents.editDocument')}</Title>
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item label={t('documents.category')}>
          <Input value={language === 'ar' ? doc.categoryName_AR : doc.categoryName_EN} disabled />
        </Form.Item>
        <Form.Item name="title" label={t('documents.title_field')} rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="status" label={t('common.status')}>
          <Select options={['Active', 'Archived'].map((s) => ({ value: s, label: t(`documents.status.${s}`) }))} />
        </Form.Item>

        {category.fields.length > 0 && (
          <>
            <Divider />
            {category.fields
              .sort((a: any, b: any) => a.displayOrder - b.displayOrder)
              .map((field: any) => (
                <DynamicFormField key={field.id} field={field} language={language} />
              ))}
          </>
        )}

        <Divider>{t('documents.files')}</Divider>
        <FileUploadArea documentId={Number(id)} existingFiles={doc.files} language={language} />

        <Form.Item style={{ marginTop: 24 }}>
          <Space>
            <Button type="primary" htmlType="submit" loading={loading}>{t('common.save')}</Button>
            <Button onClick={() => navigate(`/documents/${id}`)}>{t('common.cancel')}</Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
}
