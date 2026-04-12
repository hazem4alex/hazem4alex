import { useEffect, useState, useCallback } from 'react';
import {
  Table, Button, Input, Space, Select, DatePicker, Typography, Card,
  Collapse, Tag, Popconfirm, message, Row, Col, TreeSelect
} from 'antd';
import { PlusOutlined, SearchOutlined, EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
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

  // Filters
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

  const statusColors: Record<string, string> = { Active: 'green', Archived: 'orange', Deleted: 'red' };

  const columns = [
    { title: t('documents.title_field'), dataIndex: 'title', key: 'title', render: (v: string, r: any) => <Button type="link" onClick={() => navigate(`/documents/${r.id}`)}>{v}</Button> },
    { title: t('documents.category'), key: 'cat', render: (_: any, r: any) => language === 'ar' ? r.categoryName_AR : r.categoryName_EN },
    { title: t('documents.entryDate'), dataIndex: 'entryDatetime', key: 'date', render: (v: string) => new Date(v).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US') },
    { title: t('documents.addedBy'), key: 'addedBy', render: (_: any, r: any) => language === 'ar' ? r.addedByName_AR : r.addedByName_EN },
    { title: t('common.status'), dataIndex: 'status', key: 'status', render: (v: string) => <Tag color={statusColors[v] || 'default'}>{t(`documents.status.${v}`)}</Tag> },
    {
      title: t('common.actions'),
      key: 'actions',
      render: (_: any, r: any) => (
        <Space>
          <Button icon={<EyeOutlined />} size="small" onClick={() => navigate(`/documents/${r.id}`)} />
          <Button icon={<EditOutlined />} size="small" onClick={() => navigate(`/documents/${r.id}/edit`)} />
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
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>{t('documents.title')}</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/documents/add')}>
          {t('documents.addDocument')}
        </Button>
      </div>

      <Collapse style={{ marginBottom: 16 }} items={[{
        key: 'search',
        label: t('documents.searchDocuments'),
        children: (
          <Row gutter={[12, 12]}>
            <Col xs={24} md={8}>
              <Input placeholder={t('documents.titleContains')} value={titleFilter} onChange={(e) => setTitleFilter(e.target.value)} allowClear />
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

            {/* Dynamic field filters */}
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
                  <Button danger onClick={() => setFieldFilters((prev) => prev.filter((_, j) => j !== i))}>{t('common.delete')}</Button>
                </Space>
              </Col>
            ))}

            {selectedCat && selectedCat.fields.length > 0 && (
              <Col xs={24}>
                <Button size="small" onClick={addFieldFilter}>{t('documents.addFilter')}</Button>
              </Col>
            )}

            <Col xs={24}>
              <Button type="primary" icon={<SearchOutlined />} onClick={() => doSearch(1)}>{t('common.search')}</Button>
            </Col>
          </Row>
        ),
      }]} />

      <Table
        rowKey="id"
        columns={columns}
        dataSource={results.items}
        loading={loading}
        pagination={{
          current: results.page,
          pageSize: results.pageSize,
          total: results.totalCount,
          onChange: (p) => doSearch(p),
          showTotal: (total) => `${total}`,
        }}
      />
    </>
  );
}
