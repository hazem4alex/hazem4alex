import { useEffect, useState } from 'react';
import {
  Card, Typography, Descriptions, Tag, Button, Space, Divider,
  Timeline, Spin, Popconfirm, message, Row, Col
} from 'antd';
import {
  EditOutlined, DeleteOutlined, ArrowLeftOutlined,
  FileTextOutlined, ClockCircleOutlined, UserOutlined
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getDocument, getDocumentHistory, deleteDocument } from '../../api/documents';
import { useSettingsStore } from '../../store/settingsStore';
import { useAuthStore } from '../../store/authStore';
import FileUploadArea from '../../components/common/FileUploadArea';

const { Title, Text } = Typography;

const NAVY  = '#0D1B2A';
const AMBER = '#C9973A';

function formatValue(value: string | null, fieldType: string, lang: string): string {
  if (!value) return '—';
  if (fieldType === 'date')     return new Date(value).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US');
  if (fieldType === 'datetime') return new Date(value).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US');
  return value;
}

const statusConfig: Record<string, { color: string; bg: string; border: string }> = {
  Active:   { color: '#166534', bg: '#DCFCE7', border: '#86EFAC' },
  Archived: { color: '#92400E', bg: '#FEF3C7', border: '#FCD34D' },
  Deleted:  { color: '#991B1B', bg: '#FEE2E2', border: '#FCA5A5' },
};

const changeTypeColors: Record<string, string> = {
  Created: '#16a34a',
  Updated: '#2563eb',
  FileAdded: '#7c3aed',
  FileDeleted: '#dc2626',
  StatusChanged: '#d97706',
};

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

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
      <Spin size="large" />
    </div>
  );
  if (!doc) return null;

  const statusCfg = statusConfig[doc.status] ?? { color: '#555', bg: '#eee', border: '#ccc' };

  return (
    <div>
      {/* Page header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        marginBottom: 24, paddingBottom: 20,
        borderBottom: '1px solid var(--vault-border)',
      }}>
        <Space align="start">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/documents')}
            style={{ border: '1px solid var(--vault-border)', color: 'var(--vault-muted)' }}
          />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 7,
                background: '#EEF2FF',
                border: '1px solid #C7D2FE',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <FileTextOutlined style={{ color: NAVY, fontSize: 17 }} />
              </div>
              <Title level={4} style={{ margin: 0, fontFamily: "'EB Garamond', serif", color: NAVY, fontSize: 22 }}>
                {doc.title}
              </Title>
            </div>
            <span style={{
              display: 'inline-block',
              padding: '2px 12px', borderRadius: 20, fontSize: 11,
              fontWeight: 600, letterSpacing: '0.04em',
              color: statusCfg.color, background: statusCfg.bg, border: `1px solid ${statusCfg.border}`,
            }}>
              {t(`documents.status.${doc.status}`)}
            </span>
          </div>
        </Space>

        <Space>
          <Button
            icon={<EditOutlined />}
            type="primary"
            onClick={() => navigate(`/documents/${id}/edit`)}
            style={{ background: NAVY, borderColor: NAVY, fontWeight: 600 }}
          >
            {t('common.edit')}
          </Button>
          {isManager() && (
            <Popconfirm title={t('documents.deleteConfirm')} onConfirm={handleDelete}>
              <Button icon={<DeleteOutlined />} danger>{t('common.delete')}</Button>
            </Popconfirm>
          )}
        </Space>
      </div>

      <Row gutter={20}>
        <Col xs={24} lg={16}>
          {/* Document metadata */}
          <Card
            style={{ marginBottom: 16, border: '1px solid var(--vault-border)', borderRadius: 8, boxShadow: 'none' }}
            bodyStyle={{ padding: '20px 24px' }}
          >
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 16,
            }}>
              {[
                { label: t('documents.category'), value: language === 'ar' ? doc.categoryName_AR : doc.categoryName_EN },
                { label: t('documents.entryDate'), value: new Date(doc.entryDatetime).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US') },
                { label: t('documents.addedBy'), value: language === 'ar' ? doc.addedByName_AR : doc.addedByName_EN },
                { label: t('documents.lastModified'), value: new Date(doc.lastModified).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US') },
                { label: t('documents.lastModifiedBy'), value: language === 'ar' ? doc.lastModifiedByName_AR : doc.lastModifiedByName_EN },
              ].map((item) => (
                <div key={item.label} style={{ padding: '10px 14px', background: '#F8F9FC', borderRadius: 6 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--vault-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: 14, color: NAVY, fontWeight: 500 }}>
                    {item.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Custom fields */}
            {doc.fieldValues.length > 0 && (
              <>
                <Divider style={{ margin: '16px 0' }}>
                  <Text style={{ fontSize: 12, color: 'var(--vault-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    {language === 'ar' ? 'الحقول الإضافية' : 'Custom Fields'}
                  </Text>
                </Divider>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {doc.fieldValues.map((fv: any) => (
                    <div key={fv.fieldId} style={{ padding: '10px 14px', background: `${AMBER}0A`, borderRadius: 6, border: `1px solid ${AMBER}22` }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: AMBER, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>
                        {language === 'ar' ? fv.label_AR : fv.label_EN}
                      </div>
                      <div style={{ fontSize: 14, color: NAVY, fontWeight: 500 }}>
                        {formatValue(fv.value, fv.fieldType, language)}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </Card>

          {/* Files */}
          <Card
            title={
              <span style={{ fontFamily: "'EB Garamond', serif", fontSize: 17, color: NAVY }}>
                {t('documents.files')}
              </span>
            }
            style={{ border: '1px solid var(--vault-border)', borderRadius: 8, boxShadow: 'none' }}
          >
            <FileUploadArea
              documentId={Number(id)}
              existingFiles={doc.files}
              language={language}
              onFilesChanged={load}
            />
          </Card>
        </Col>

        {/* History */}
        <Col xs={24} lg={8}>
          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ClockCircleOutlined style={{ color: AMBER }} />
                <span style={{ fontFamily: "'EB Garamond', serif", fontSize: 17, color: NAVY }}>
                  {t('documents.history')}
                </span>
              </div>
            }
            style={{ border: '1px solid var(--vault-border)', borderRadius: 8, boxShadow: 'none', position: 'sticky', top: 16 }}
          >
            <Timeline
              items={history.map((h) => ({
                dot: (
                  <div style={{
                    width: 10, height: 10, borderRadius: '50%',
                    background: changeTypeColors[h.changeType] ?? '#999',
                    marginTop: 3,
                  }} />
                ),
                children: (
                  <div style={{ paddingBottom: 4 }}>
                    <div style={{ marginBottom: 3 }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '1px 8px', borderRadius: 4,
                        fontSize: 11, fontWeight: 600,
                        background: `${changeTypeColors[h.changeType] ?? '#999'}18`,
                        color: changeTypeColors[h.changeType] ?? '#999',
                      }}>
                        {t(`documents.changeTypes.${h.changeType}`)}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--vault-muted)', marginBottom: 2 }}>
                      {new Date(h.changedAt).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')}
                    </div>
                    <div style={{ fontSize: 13, color: NAVY, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <UserOutlined style={{ fontSize: 11, color: 'var(--vault-muted)' }} />
                      {language === 'ar' ? h.changedByName_AR : h.changedByName_EN}
                    </div>
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
