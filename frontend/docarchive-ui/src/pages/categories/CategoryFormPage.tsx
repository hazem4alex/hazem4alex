import { useEffect, useState } from 'react';
import {
  Form, Input, Button, Card, Typography, Space, Select, Switch,
  Divider, Table, Modal, Checkbox, message, Popconfirm, Tag, Alert
} from 'antd';
import { PlusOutlined, DeleteOutlined, HolderOutlined, EditOutlined } from '@ant-design/icons';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getCategory, createCategory, updateCategory, getCategoryTree } from '../../api/categories';
import { useSettingsStore } from '../../store/settingsStore';

const { Title, Text } = Typography;

const FIELD_TYPES = ['string', 'number', 'date', 'datetime', 'dropdown'];

interface FieldOption {
  id?: number;
  optionValue: string;
  label_AR: string;
  label_EN: string;
  displayOrder: number;
}

interface Field {
  id?: number;
  label_AR: string;
  label_EN: string;
  fieldType: string;
  isRequired: boolean;
  displayOrder: number;
  options: FieldOption[];
}

export default function CategoryFormPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const language = useSettingsStore((s) => s.language);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fields, setFields] = useState<Field[]>([]);
  const [treeOptions, setTreeOptions] = useState<any[]>([]);
  const [isLeaf, setIsLeaf] = useState(true);
  const [fieldModal, setFieldModal] = useState<{ open: boolean; index?: number; data?: Field }>({ open: false });
  const [fieldForm] = Form.useForm();
  const [optionRows, setOptionRows] = useState<FieldOption[]>([]);

  const isEdit = Boolean(id);

  // Flatten tree for parent selector
  const flattenTree = (nodes: any[], prefix = ''): any[] => {
    return nodes.flatMap((n) => [
      { value: n.id, label: prefix + (language === 'ar' ? n.name_AR : n.name_EN) },
      ...flattenTree(n.children, prefix + '-- '),
    ]);
  };

  useEffect(() => {
    getCategoryTree().then((tree) => {
      setTreeOptions([
        { value: null, label: t('categories.noParent') },
        ...flattenTree(tree),
      ]);
    });

    if (isEdit) {
      getCategory(Number(id)).then((data) => {
        form.setFieldsValue({
          parentId: data.parentId ?? null,
          name_AR: data.name_AR,
          name_EN: data.name_EN,
          description_AR: data.description_AR,
          description_EN: data.description_EN,
          isActive: data.isActive,
        });
        const mapped: Field[] = data.fields.map((f: any) => ({
          id: f.id,
          label_AR: f.label_AR,
          label_EN: f.label_EN,
          fieldType: f.fieldType,
          isRequired: f.isRequired,
          displayOrder: f.displayOrder,
          options: f.options,
        }));
        setFields(mapped);
        setIsLeaf(data.isLeaf);
      });
    } else {
      const parentId = searchParams.get('parentId');
      if (parentId) form.setFieldValue('parentId', Number(parentId));
    }
  }, [id]);

  const openAddField = () => {
    fieldForm.resetFields();
    setOptionRows([]);
    setFieldModal({ open: true });
  };

  const openEditField = (index: number) => {
    const f = fields[index];
    fieldForm.setFieldsValue(f);
    setOptionRows([...f.options]);
    setFieldModal({ open: true, index, data: f });
  };

  const saveField = () => {
    fieldForm.validateFields().then((vals) => {
      const newField: Field = {
        ...vals,
        id: fieldModal.data?.id,
        options: optionRows,
        displayOrder: fieldModal.index !== undefined ? fields[fieldModal.index].displayOrder : fields.length,
      };
      if (fieldModal.index !== undefined) {
        setFields((prev) => prev.map((f, i) => (i === fieldModal.index ? newField : f)));
      } else {
        setFields((prev) => [...prev, newField]);
      }
      setFieldModal({ open: false });
    });
  };

  const removeField = (index: number) => {
    setFields((prev) => prev.filter((_, i) => i !== index));
  };

  const addOption = () => {
    setOptionRows((prev) => [...prev, { optionValue: '', label_AR: '', label_EN: '', displayOrder: prev.length }]);
  };

  const updateOption = (index: number, key: keyof FieldOption, value: string | number) => {
    setOptionRows((prev) => prev.map((o, i) => (i === index ? { ...o, [key]: value } : o)));
  };

  const removeOption = (index: number) => {
    setOptionRows((prev) => prev.filter((_, i) => i !== index));
  };

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const payload = {
        ...values,
        parentId: values.parentId || null,
        fields: fields.map((f, i) => ({ ...f, displayOrder: i })),
      };
      if (isEdit) {
        await updateCategory(Number(id), payload);
      } else {
        await createCategory({ parentId: payload.parentId, name_AR: payload.name_AR, name_EN: payload.name_EN, description_AR: payload.description_AR, description_EN: payload.description_EN });
      }
      message.success(t('common.success'));
      navigate('/categories');
    } catch {
      message.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const watchedType = Form.useWatch('fieldType', fieldForm);

  return (
    <Card style={{ maxWidth: 800, margin: '0 auto' }}>
      <Title level={4}>{isEdit ? t('categories.editCategory') : t('categories.addCategory')}</Title>

      <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ isActive: true }}>
        <Form.Item name="parentId" label={t('categories.parent')}>
          <Select options={treeOptions} />
        </Form.Item>
        <Form.Item name="name_AR" label={t('categories.nameAR')} rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="name_EN" label={t('categories.nameEN')} rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="description_AR" label={t('categories.descriptionAR')}>
          <Input.TextArea rows={2} />
        </Form.Item>
        <Form.Item name="description_EN" label={t('categories.descriptionEN')}>
          <Input.TextArea rows={2} />
        </Form.Item>
        {isEdit && (
          <Form.Item name="isActive" label={t('common.status')} valuePropName="checked">
            <Switch checkedChildren={t('common.active')} unCheckedChildren={t('common.inactive')} />
          </Form.Item>
        )}

        {/* Field Builder — only for leaf categories */}
        <Divider />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text strong>{t('categories.fields')}</Text>
          {isLeaf && (
            <Button icon={<PlusOutlined />} size="small" onClick={openAddField}>
              {t('categories.addField')}
            </Button>
          )}
        </div>
        {!isLeaf && <Alert message={t('categories.leafOnly')} type="info" showIcon style={{ marginBottom: 12 }} />}
        {isLeaf && fields.length > 0 && (
          <Table
            size="small"
            rowKey={(_, i) => String(i)}
            dataSource={fields}
            pagination={false}
            columns={[
              { title: '#', render: (_, __, i) => <HolderOutlined style={{ cursor: 'grab' }} />, width: 32 },
              { title: language === 'ar' ? 'الاسم' : 'Label', render: (_, f) => language === 'ar' ? f.label_AR : f.label_EN },
              { title: t('categories.fieldType'), dataIndex: 'fieldType', render: (v) => t(`categories.fieldTypes.${v}`) },
              { title: t('categories.required'), dataIndex: 'isRequired', render: (v) => v ? <Tag color="red">✓</Tag> : null },
              {
                title: t('common.actions'),
                render: (_, __, i) => (
                  <Space>
                    <Button icon={<EditOutlined />} size="small" onClick={() => openEditField(i)} />
                    <Popconfirm title={t('common.confirm')} onConfirm={() => removeField(i)}>
                      <Button icon={<DeleteOutlined />} size="small" danger />
                    </Popconfirm>
                  </Space>
                ),
              },
            ]}
          />
        )}

        <Form.Item style={{ marginTop: 24 }}>
          <Space>
            <Button type="primary" htmlType="submit" loading={loading}>{t('common.save')}</Button>
            <Button onClick={() => navigate('/categories')}>{t('common.cancel')}</Button>
          </Space>
        </Form.Item>
      </Form>

      {/* Field Add/Edit Modal */}
      <Modal
        open={fieldModal.open}
        title={fieldModal.index !== undefined ? t('categories.addField') : t('categories.addField')}
        onOk={saveField}
        onCancel={() => setFieldModal({ open: false })}
        width={600}
        okText={t('common.save')}
        cancelText={t('common.cancel')}
      >
        <Form form={fieldForm} layout="vertical" initialValues={{ fieldType: 'string', isRequired: false }}>
          <Form.Item name="label_AR" label={t('categories.fieldLabelAR')} rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="label_EN" label={t('categories.fieldLabelEN')} rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="fieldType" label={t('categories.fieldType')}>
            <Select options={FIELD_TYPES.map((v) => ({ value: v, label: t(`categories.fieldTypes.${v}`) }))} />
          </Form.Item>
          <Form.Item name="isRequired" valuePropName="checked">
            <Checkbox>{t('categories.required')}</Checkbox>
          </Form.Item>

          {watchedType === 'dropdown' && (
            <>
              <Divider>{t('categories.options')}</Divider>
              {optionRows.map((opt, i) => (
                <Space key={i} style={{ display: 'flex', marginBottom: 8 }} align="start">
                  <Input
                    placeholder={t('categories.optionValue')}
                    value={opt.optionValue}
                    onChange={(e) => updateOption(i, 'optionValue', e.target.value)}
                    style={{ width: 100 }}
                  />
                  <Input
                    placeholder={t('categories.optionLabelAR')}
                    value={opt.label_AR}
                    onChange={(e) => updateOption(i, 'label_AR', e.target.value)}
                    style={{ width: 130 }}
                  />
                  <Input
                    placeholder={t('categories.optionLabelEN')}
                    value={opt.label_EN}
                    onChange={(e) => updateOption(i, 'label_EN', e.target.value)}
                    style={{ width: 130 }}
                  />
                  <Button icon={<DeleteOutlined />} danger size="small" onClick={() => removeOption(i)} />
                </Space>
              ))}
              <Button icon={<PlusOutlined />} size="small" onClick={addOption}>{t('categories.addOption')}</Button>
            </>
          )}
        </Form>
      </Modal>
    </Card>
  );
}
