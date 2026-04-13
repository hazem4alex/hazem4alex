import { useEffect, useRef, useState } from 'react';
import { Table, Button, Space, Tag, Typography, Spin, Empty, Input } from 'antd';
import type { InputRef, TableColumnType } from 'antd';
import type { FilterDropdownProps } from 'antd/es/table/interface';
import { PlusOutlined, EditOutlined, SearchOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getCategoryTree } from '../../api/categories';
import { useSettingsStore } from '../../store/settingsStore';

const { Title } = Typography;

interface CategoryNode {
  id: number;
  name_AR: string;
  name_EN: string;
  parentId: number | null;
  isLeaf: boolean;
  isActive: boolean;
  isUserAccessible: boolean;
  children: CategoryNode[];
}

interface FlatRow {
  id: number;
  name_AR: string;
  name_EN: string;
  parentName_AR: string;
  parentName_EN: string;
  isLeaf: boolean;
  isActive: boolean;
  isUserAccessible: boolean;
  depth: number;
}

function flatten(nodes: CategoryNode[], parentName_AR = '', parentName_EN = '', depth = 0): FlatRow[] {
  return nodes.flatMap((n) => [
    {
      id: n.id,
      name_AR: n.name_AR,
      name_EN: n.name_EN,
      parentName_AR,
      parentName_EN,
      isLeaf: n.isLeaf,
      isActive: n.isActive,
      isUserAccessible: n.isUserAccessible,
      depth,
    },
    ...flatten(n.children, n.name_AR, n.name_EN, depth + 1),
  ]);
}

function useSearchFilter(dataIndex: keyof FlatRow): TableColumnType<FlatRow> {
  const searchInput = useRef<InputRef>(null);

  const handleSearch = (confirm: FilterDropdownProps['confirm']) => confirm();
  const handleReset = (clearFilters: (() => void) | undefined, confirm: FilterDropdownProps['confirm']) => {
    clearFilters?.();
    confirm();
  };

  return {
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
      <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
        <Input
          ref={searchInput}
          placeholder="Search..."
          value={selectedKeys[0]}
          onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => handleSearch(confirm)}
          style={{ display: 'block', marginBottom: 8 }}
        />
        <Space>
          <Button type="primary" icon={<SearchOutlined />} size="small" onClick={() => handleSearch(confirm)}>
            Search
          </Button>
          <Button size="small" onClick={() => handleReset(clearFilters, confirm)}>
            Reset
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered: boolean) => (
      <SearchOutlined style={{ color: filtered ? '#1677ff' : undefined }} />
    ),
    onFilter: (value, record) => {
      const cell = record[dataIndex];
      return String(cell ?? '').toLowerCase().includes(String(value).toLowerCase());
    },
    onFilterDropdownOpenChange: (visible) => {
      if (visible) setTimeout(() => searchInput.current?.select(), 100);
    },
  };
}

export default function CategoryListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const language = useSettingsStore((s) => s.language);
  const [rows, setRows] = useState<FlatRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCategoryTree()
      .then((tree: CategoryNode[]) => setRows(flatten(tree)))
      .finally(() => setLoading(false));
  }, []);

  const nameFilter = useSearchFilter(language === 'ar' ? 'name_AR' : 'name_EN');
  const parentFilter = useSearchFilter(language === 'ar' ? 'parentName_AR' : 'parentName_EN');

  const columns: TableColumnType<FlatRow>[] = [
    {
      title: language === 'ar' ? t('categories.nameAR') : t('categories.nameEN'),
      key: 'name',
      render: (_, r) => (
        <span style={{ paddingLeft: r.depth * 20 }}>
          {language === 'ar' ? r.name_AR : r.name_EN}
        </span>
      ),
      ...nameFilter,
    },
    {
      title: t('categories.parent'),
      key: 'parent',
      render: (_, r) => language === 'ar' ? r.parentName_AR : r.parentName_EN || '—',
      ...parentFilter,
    },
    {
      title: t('common.status'),
      dataIndex: 'isActive',
      key: 'isActive',
      filters: [
        { text: t('common.active'), value: true },
        { text: t('common.inactive'), value: false },
      ],
      onFilter: (value, r) => r.isActive === value,
      render: (v: boolean) => <Tag color={v ? 'green' : 'red'}>{v ? t('common.active') : t('common.inactive')}</Tag>,
    },
    {
      title: t('categories.userAccess'),
      dataIndex: 'isUserAccessible',
      key: 'isUserAccessible',
      filters: [
        { text: t('common.yes'), value: true },
        { text: t('common.no'), value: false },
      ],
      onFilter: (value, r) => r.isUserAccessible === value,
      render: (v: boolean) => <Tag color={v ? 'blue' : 'default'}>{v ? t('common.yes') : t('common.no')}</Tag>,
    },
    {
      title: t('common.actions'),
      key: 'actions',
      render: (_, r) => (
        <Space>
          <Button icon={<EditOutlined />} size="small" onClick={() => navigate(`/categories/${r.id}/edit`)} />
          <Button
            icon={<PlusOutlined />}
            size="small"
            onClick={() => navigate(`/categories/new?parentId=${r.id}`)}
          />
        </Space>
      ),
    },
  ];

  if (loading) return <Spin />;

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>{t('categories.title')}</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/categories/new')}>
          {t('categories.addCategory')}
        </Button>
      </div>

      {rows.length === 0 ? (
        <Empty description={t('common.noData')} />
      ) : (
        <Table
          rowKey="id"
          columns={columns}
          dataSource={rows}
          size="small"
          pagination={{ pageSize: 20, showSizeChanger: false }}
        />
      )}
    </>
  );
}
