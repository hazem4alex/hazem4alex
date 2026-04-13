import { useEffect, useState, useCallback } from 'react';
import {
  Table, Button, Input, Space, Select, DatePicker, Typography,
  Collapse, Tag, Popconfirm, message, Row, Col, TreeSelect, Divider
} from 'antd';
import {
  PlusOutlined, SearchOutlined, EyeOutlined, EditOutlined, DeleteOutlined,
  FilterOutlined, FileTextOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { searchDocuments, deleteDocument } from '../../api/documents';
import { getCategoryTree } from '../../api/categories';
import { getUsers } from '../../api/users';
import { useSettingsStore } from '../../store/settingsStore';
import { useAuthStore } from '../../store/authStore';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const NAVY  = '#0D1B2A';
const AMBER = '#C9973A';

interface CategoryNode { id: number; name_AR: string; name_EN: string; isLeaf: boolean; children: CategoryNode[]; fields: any[]; }

function buildTreeSelectData(nodes: CategoryNode[], language: string): any[] {
  return nodes.map((n) => ({
    value: n.id,
    title: language === 'ar' ? n.name_AR : n.name_EN,
    children: buildTreeSelectData(n.children, language),
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

const statusConfig: Record<string, { color: string; bg: string; border: string }> = {
  Active:   { color: '#166534', bg: '#DCFCE7', border: '#86EFAC' },
  Archived: { color: '#92400E', bg: '#FEF3C7', border: '#FCD34D' },
  Deleted:  { color: '#991B1B', bg: '#FEE2E2', border: '#FCA5A5' },
};

export default function DocumentListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const language = useSettingsStore((s) => s.language);
  const { isManager } = useAuthStore();

  const [tree, setTree] = useState<CategoryNode[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedCat, setSelectedCat] = useState<CategoryNode | null>(null);

  const [results, setResults] = useState<any>({ items: [], totalCount: 0, page: 1, pageSize: 20 });
  const [loading, setLoading] = useState(false);

  const [titleFilter, setTitleFilter] = useState('');
  const [catFilter, setCatFilter] = useState<number | undefined>();
  const [userFilter, setUserFilter] = useState<number | undefined>();
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [fieldFilters, setFieldFilters] = useState<{ fieldId: number; operator: string; value: string }[]>([]);
  const [page, setPage] = useState(1);

  useEffect(() => {
    getCategoryTree().then(setTree);
    getUsers().then(setUsers).catch(() => {});
  }, []);

  const doSearch = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const data = await searchDocuments({
        categoryId: catFilter ?? null,
        titleContains: titleFilter || null,
        addedBy: userFilter ?? null,
        entryDateFrom: dateRange?.[0]?.toISOString() ?? null,
        entryDateTo: dateRange?.[1]?.toISOString() ?? null,
        status: statusFilter ?? null,
        fieldFilters: fieldFilters.filter((f) => f.value),
        page: p,
        pageSize: 20,
      });
      setResults(data);
      setPage(p);
    } catch {
      message.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  }, [titleFilter, catFilter, userFilter, dateRange, statusFilter, fieldFilters]);

  useEffect(() => { doSearch(1); }, []);

  const handleCatChange = (id: number) => {
    setCatFilter(id);
    const cat = id ? findCategory(tree, id) : null;
    setSelectedCat(cat);
    setFieldFilters([]);
  };

  const addFieldFilter = () => {
    if (!selectedCat) return;
    const field = selectedCat.fields[0];
    if (!field) return;
    setFieldFilters((prev) => [...prev, { fieldId: field.id, operator: 'contains', value: '' }]);
  };

  const updateFieldFilter = (index: number, key: string, value: any) => {
    setFieldFilters((prev) => prev.map((f, i) => (i === index ? { ...f, [key]: value } : f)));
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteDocument(id);
      message.success(t('common.success'));
      doSearch(page);
    } catch {
      message.error(t('common.error'));
    }
  };

  const columns = [
    {
      title: t('documents.title_field'),
      dataIndex: 'title',
      key: 'title',
      render: (v: string, r: any) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 5,
            background: '#F0F4FF',
            border: '1px solid #D0D9EE',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <FileTextOutlined style={{ fontSize: 13, color: NAVY }} />
          </div>
          <Button
            type="link"
            onClick={() => navigate(`/documents/${r.id}`)}
            style={{ padding: 0, height: 'auto', color: NAVY, fontWeight: 600, fontSize: 13 }}
          >
            {v}
          </Button>
        </div>
      ),
    },
    {
      title: t('documents.category'),
      key: 'cat',
      render: (_: any, r: any) => (
        <Text style={{ fontSize: 13, color: 'var(--vault-muted)' }}>
          {language === 'ar' ? r.categoryName_AR : r.categoryName_EN}
        </Text>
      ),
    },
    {
      title: t('documents.entryDate'),
      dataIndex: 'entryDatetime',
      key: 'date',
      render: (v: string) => (
        <Text style={{ fontSize: 12, color: 'var(--vault-muted)', fontVariantNumeric: 'tabular-nums' }}>
          {new Date(v).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}
        </Text>
      ),
    },
    {
      title: t('documents.addedBy'),
      key: 'addedBy',
      render: (_: any, r: any) => (
        <Text style={{ fontSize: 13 }}>
          {language === 'ar' ? r.addedByName_AR : r.addedByName_EN}
        </Text>
      ),
    },
    {
      title: t('common.status'),
      dataIndex: 'status',
      key: 'status',
      render: (v: string) => {
        const cfg = statusConfig[v] ?? { color: '#555', bg: '#eee', border: '#ccc' };
        return (
          <span style={{
            display: 'inline-block',
            padding: '2px 10px',
            borderRadius: 20,
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.04em',
            color: cfg.color,
            background: cfg.bg,
            border: `1px solid ${cfg.border}`,
          }}>
            {t(`documents.status.${v}`)}
          </span>
        );
      },
    },
    {
      title: t('common.actions'),
      key: 'actions',
      width: 120,
      render: (_: any, r: any) => (
        <Space size={4}>
          <Button
            icon={<EyeOutlined />} size="small"
            onClick={() => navigate(`/documents/${r.id}`)}
            style={{ border: '1px solid var(--vault-border)', color: NAVY }}
          />
          <Button
            icon={<EditOutlined />} size="small"
            onClick={() => navigate(`/documents/${r.id}/edit`)}
            style={{ border: '1px solid var(--vault-border)', color: NAVY }}
          />
          {isManager() && (
            <Popconfirm title={t('documents.deleteConfirm')} onConfirm={() => handleDelete(r.id)}>
              <Button icon={<DeleteOutlined />} size="small" danger />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <Title level={4} style={{ margin: 0, fontFamily: "'EB Garamond', serif", color: NAVY, fontSize: 22 }}>
            {t('documents.title')}
          </Title>
          <Text style={{ color: 'var(--vault-muted)', fontSize: 13 }}>
            {results.totalCount} {language === 'ar' ? 'وثيقة' : 'records'}
          </Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate('/documents/add')}
          style={{ background: NAVY, borderColor: NAVY, fontWeight: 600 }}
        >
          {t('documents.addDocument')}
        </Button>
      </div>

      {/* Search / Filter panel */}
      <Collapse
        style={{ marginBottom: 16, borderRadius: 8, border: '1px solid var(--vault-border)' }}
        expandIcon={({ isActive }) => <FilterOutlined rotate={isActive ? 90 : 0} style={{ color: AMBER }} />}
        items={[{
          key: 'search',
          label: (
            <span style={{ fontWeight: 600, color: NAVY, fontSize: 13 }}>
              {t('documents.searchDocuments')}
            </span>
          ),
          children: (
            <Row gutter={[12, 12]}>
              <Col xs={24} md={8}>
                <Input
                  placeholder={t('documents.titleContains')}
                  value={titleFilter}
                  onChange={(e) => setTitleFilter(e.target.value)}
                  allowClear
                  prefix={<SearchOutlined style={{ color: 'var(--vault-muted)' }} />}
                  style={{ borderRadius: 6 }}
                />
              </Col>
              <Col xs={24} md={8}>
                <TreeSelect
                  treeData={buildTreeSelectData(tree, language)}
                  onChange={handleCatChange}
                  placeholder={t('documents.category')}
                  allowClear
                  style={{ width: '100%' }}
                  treeDefaultExpandAll
                />
              </Col>
              <Col xs={24} md={8}>
                <Select
                  placeholder={t('documents.addedBy')}
                  allowClear
                  style={{ width: '100%' }}
                  options={users.map((u) => ({ value: u.id, label: language === 'ar' ? u.fullName_AR : u.fullName_EN }))}
                  onChange={setUserFilter}
                />
              </Col>
              <Col xs={24} md={12}>
                <RangePicker style={{ width: '100%' }} onChange={(v) => setDateRange(v as any)} />
              </Col>
              <Col xs={24} md={6}>
                <Select
                  placeholder={t('common.status')}
                  allowClear
                  style={{ width: '100%' }}
                  options={['Active', 'Archived'].map((s) => ({ value: s, label: t(`documents.status.${s}`) }))}
                  onChange={setStatusFilter}
                />
              </Col>

              {fieldFilters.map((ff, i) => (
                <Col xs={24} key={i}>
                  <Space wrap>
                    <Select
                      value={ff.fieldId}
                      style={{ width: 180 }}
                      onChange={(v) => updateFieldFilter(i, 'fieldId', v)}
                      options={selectedCat?.fields.map((f) => ({ value: f.id, label: language === 'ar' ? f.label_AR : f.label_EN })) ?? []}
                    />
                    <Select
                      value={ff.operator}
                      style={{ width: 130 }}
                      onChange={(v) => updateFieldFilter(i, 'operator', v)}
                      options={['contains', 'equals', 'startsWith'].map((o) => ({ value: o, label: t(`documents.operator.${o}`) }))}
                    />
                    <Input
                      value={ff.value}
                      onChange={(e) => updateFieldFilter(i, 'value', e.target.value)}
                      style={{ width: 180 }}
                    />
                    <Button danger size="small" onClick={() => setFieldFilters((prev) => prev.filter((_, j) => j !== i))}>
                      {t('common.delete')}
                    </Button>
                  </Space>
                </Col>
              ))}

              {selectedCat && selectedCat.fields.length > 0 && (
                <Col xs={24}>
                  <Button size="small" onClick={addFieldFilter} style={{ borderColor: AMBER, color: AMBER }}>
                    + {t('documents.addFilter')}
                  </Button>
                </Col>
              )}

              <Col xs={24}>
                <Divider style={{ margin: '4px 0 8px' }} />
                <Button
                  type="primary"
                  icon={<SearchOutlined />}
                  onClick={() => doSearch(1)}
                  style={{ background: NAVY, borderColor: NAVY, fontWeight: 600 }}
                >
                  {t('common.search')}
                </Button>
              </Col>
            </Row>
          ),
        }]}
      />

      {/* Table */}
      <Table
        rowKey="id"
        columns={columns}
        dataSource={results.items}
        loading={loading}
        size="middle"
        style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid var(--vault-border)' }}
        pagination={{
          current: results.page,
          pageSize: results.pageSize,
          total: results.totalCount,
          onChange: (p) => doSearch(p),
          showTotal: (total) => `${total} ${language === 'ar' ? 'سجل' : 'records'}`,
          style: { padding: '12px 16px' },
        }}
      />
    </div>
  );
}
