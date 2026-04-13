import { useEffect, useState } from 'react';
import {
  Card, Typography, Descriptions, Tag, Button, Space, Divider,
  Timeline, Collapse, Spin, Popconfirm, message, Row, Col
} from 'antd';
import { EditOutlined, DeleteOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getDocument, getDocumentHistory, deleteDocument } from '../../api/documents';
import { useSettingsStore } from '../../store/settingsStore';
import { useAuthStore } from '../../store/authStore';
import FileUploadArea from '../../components/common/FileUploadArea';

const { Title, Text } = Typography;

function formatValue(value: string | null, fieldType: string, lang: string): string {
  if (!value) return '—';
  if (fieldType === 'date') return new Date(value).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US');
  if (fieldType === 'datetime') return new Date(value).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US');
  return value;
}

export default function DocumentViewPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const language = useSettingsStore((s) => s.language);
  const { isManager } = useAuthStore();
  const [doc, setDoc] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    Promise.all([getDocument(Number(id)), getDocumentHistory(Number(id))])
      .then(([d, h]) => { setDoc(d); setHistory(h); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const handleDelete = async () => {
    try {
      await deleteDocument(Number(id));
      message.success(t('common.success'));
      navigate('/documents');
    } catch {
      message.error(t('common.error'));
    }
  };

  if (loading) return <Spin />;
  if (!doc) return null;

  const statusColors: Record<string, string> = { Active: 'green', Archived: 'orange', Deleted: 'red' };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/documents')}>{t('common.back')}</Button>
          <Title level={4} style={{ margin: 0 }}>{doc.title}</Title>
        </Space>
        <Space>
          <Button icon={<EditOutlined />} type="primary" onClick={() => navigate(`/documents/${id}/edit`)}>
            {t('common.edit')}
          </Button>
          {isManager() && (
            <Popconfirm title={t('documents.deleteConfirm')} onConfirm={handleDelete}>
              <Button icon={<DeleteOutlined />} danger>{t('common.delete')}</Button>
            </Popconfirm>
          )}
        </Space>
      </div>

      <Row gutter={16}>
        <Col xs={24} lg={16}>
          <Card style={{ marginBottom: 16 }}>
            <Descriptions
              bordered
              column={1}
              size="small"
              items={[
                {
                  key: 'cat',
                  label: t('documents.category'),
                  children: language === 'ar' ? doc.categoryName_AR : doc.categoryName_EN,
                },
                {
                  key: 'status',
                  label: t('common.status'),
                  children: <Tag color={statusColors[doc.status]}>{t(`documents.status.${doc.status}`)}</Tag>,
                },
                {
                  key: 'entry',
                  label: t('documents.entryDate'),
                  children: new Date(doc.entryDatetime).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US'),
                },
                {
                  key: 'addedBy',
                  label: t('documents.addedBy'),
                  children: language === 'ar' ? doc.addedByName_AR : doc.addedByName_EN,
                },
                {
                  key: 'modified',
                  label: t('documents.lastModified'),
                  children: new Date(doc.lastModified).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US'),
                },
                {
                  key: 'modifiedBy',
                  label: t('documents.lastModifiedBy'),
                  children: language === 'ar' ? doc.lastModifiedByName_AR : doc.lastModifiedByName_EN,
                },
              ]}
            />

            {doc.fieldValues.length > 0 && (
              <>
                <Divider />
                <Descriptions bordered column={1} size="small">
                  {doc.fieldValues.map((fv: any) => (
                    <Descriptions.Item key={fv.fieldId} label={language === 'ar' ? fv.label_AR : fv.label_EN}>
                      {formatValue(fv.value, fv.fieldType, language)}
                    </Descriptions.Item>
                  ))}
                </Descriptions>
              </>
            )}
          </Card>

          {/* Files */}
          <Card title={t('documents.files')}>
            <FileUploadArea
              documentId={Number(id)}
              existingFiles={doc.files}
              language={language}
              onFilesChanged={load}
            />
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title={t('documents.history')}>
            <Timeline
              items={history.map((h) => ({
                color: h.changeType === 'Created' ? 'green' : h.changeType === 'Updated' ? 'blue' : 'gray',
                children: (
                  <div>
                    <div>
                      <Tag>{t(`documents.changeTypes.${h.changeType}`)}</Tag>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {new Date(h.changedAt).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')}
                      </Text>
                    </div>
                    <Text>{language === 'ar' ? h.changedByName_AR : h.changedByName_EN}</Text>
                  </div>
                ),
              }))}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
