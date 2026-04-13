import { useEffect, useState } from 'react';
import { Form, Input, Button, Card, Typography, Space, TreeSelect, Divider, message, Spin } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getCategoryTree } from '../../api/categories';
import { createDocument } from '../../api/documents';
import { uploadFile } from '../../api/files';
import { useSettingsStore } from '../../store/settingsStore';
import DynamicFormField from '../../components/common/DynamicFormField';
import ScannerDialog from '../../components/common/ScannerDialog';
import { Upload } from 'antd';
import { UploadOutlined, ScanOutlined } from '@ant-design/icons';

const { Title } = Typography;

interface CategoryNode {
  id: number; name_AR: string; name_EN: string; isLeaf: boolean; children: CategoryNode[]; fields: any[];
}

function buildTreeSelectData(nodes: CategoryNode[], language: string): any[] {
  return nodes.map((n) => ({
    value: n.id,
    title: language === 'ar' ? n.name_AR : n.name_EN,
    disabled: !n.isLeaf,
    children: buildTreeSelectData(n.children, language),
    selectable: n.isLeaf,
  }));
}

function findCategory(nodes: CategoryNode[], id: number): CategoryNode | null {
  for (const n of nodes) {
    if (n.id === id) return n;
    const found = findCategory(n.children, id);
    if (found) return found;
  }
  return null;
}

export default function DocumentAddPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const language = useSettingsStore((s) => s.language);
  const [form] = Form.useForm();
  const [tree, setTree] = useState<CategoryNode[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<CategoryNode | null>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [treeLoading, setTreeLoading] = useState(true);
  const [scanOpen, setScanOpen] = useState(false);

  useEffect(() => {
    getCategoryTree().then(setTree).finally(() => setTreeLoading(false));
  }, []);

  const onCategoryChange = (catId: number) => {
    const cat = findCategory(tree, catId);
    setSelectedCategory(cat);
    form.resetFields(['fieldValues']);
  };

  const onFinish = async (values: any) => {
    if (!selectedCategory) { message.warning(t('documents.noCategory')); return; }
    setLoading(true);
    try {
      const fieldValues = Object.entries(values.fieldValues ?? {}).map(([fieldId, value]) => ({
        fieldId: Number(fieldId),
        value: value === null || value === undefined ? null : String(value),
      }));
      const doc = await createDocument({ categoryId: selectedCategory.id, title: values.title, fieldValues });

      // Upload pending files
      for (const file of pendingFiles) {
        await uploadFile(doc.id, file);
      }

      message.success(t('common.success'));
      navigate(`/documents/${doc.id}`);
    } catch {
      message.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  if (treeLoading) return <Spin />;

  return (
    <Card style={{ maxWidth: 800, margin: '0 auto' }}>
      <Title level={4}>{t('documents.addDocument')}</Title>
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item name="categoryId" label={t('documents.category')} rules={[{ required: true }]}>
          <TreeSelect
            treeData={buildTreeSelectData(tree, language)}
            onChange={onCategoryChange}
            placeholder={t('documents.selectCategory')}
            showSearch
            treeDefaultExpandAll
            style={{ width: '100%' }}
          />
        </Form.Item>
        <Form.Item name="title" label={t('documents.title_field')} rules={[{ required: true }]}>
          <Input />
        </Form.Item>

        {selectedCategory && selectedCategory.fields.length > 0 && (
          <>
            <Divider>{language === 'ar' ? selectedCategory.name_AR : selectedCategory.name_EN}</Divider>
            {selectedCategory.fields
              .sort((a: any, b: any) => a.displayOrder - b.displayOrder)
              .map((field: any) => (
                <DynamicFormField key={field.id} field={field} language={language} />
              ))}
          </>
        )}

        <Divider>{t('documents.files')}</Divider>
        <Space wrap style={{ marginBottom: 8 }}>
          <Upload
            multiple
            beforeUpload={(file) => { setPendingFiles((prev) => [...prev, file]); return false; }}
            fileList={pendingFiles.map((f, i) => ({ uid: String(i), name: f.name, status: 'done' }))}
            onRemove={(file) => setPendingFiles((prev) => prev.filter((_, i) => String(i) !== file.uid))}
          >
            <Button icon={<UploadOutlined />}>{t('documents.uploadFile')}</Button>
          </Upload>
          <Button icon={<ScanOutlined />} onClick={() => setScanOpen(true)}>
            {t('documents.scanDocument')}
          </Button>
        </Space>

        <ScannerDialog
          open={scanOpen}
          onClose={() => setScanOpen(false)}
          onScanned={(file) => setPendingFiles((prev) => [...prev, file])}
        />

        <Form.Item style={{ marginTop: 24 }}>
          <Space>
            <Button type="primary" htmlType="submit" loading={loading}>{t('common.save')}</Button>
            <Button onClick={() => navigate('/documents')}>{t('common.cancel')}</Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
}
