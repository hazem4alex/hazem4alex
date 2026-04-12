import { useEffect, useState } from 'react';
import { Tree, Button, Typography, Space, Tag, Spin, Empty } from 'antd';
import { PlusOutlined, EditOutlined, FolderOutlined, FileOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getCategoryTree } from '../../api/categories';
import { useSettingsStore } from '../../store/settingsStore';

const { Title } = Typography;

interface CategoryNode {
  id: number;
  name_AR: string;
  name_EN: string;
  isLeaf: boolean;
  isActive: boolean;
  children: CategoryNode[];
}

function buildTreeData(nodes: CategoryNode[], language: string, navigate: Function): any[] {
  return nodes.map((node) => ({
    key: String(node.id),
    title: (
      <Space>
        <span>{language === 'ar' ? node.name_AR : node.name_EN}</span>
        {!node.isActive && <Tag color="red">Inactive</Tag>}
        <Button
          type="link"
          size="small"
          icon={<EditOutlined />}
          onClick={(e) => { e.stopPropagation(); navigate(`/categories/${node.id}/edit`); }}
          style={{ padding: 0, height: 'auto' }}
        />
        <Button
          type="link"
          size="small"
          icon={<PlusOutlined />}
          onClick={(e) => { e.stopPropagation(); navigate(`/categories/new?parentId=${node.id}`); }}
          style={{ padding: 0, height: 'auto' }}
        />
      </Space>
    ),
    icon: node.isLeaf ? <FileOutlined /> : <FolderOutlined />,
    isLeaf: node.isLeaf,
    children: buildTreeData(node.children, language, navigate),
  }));
}

export default function CategoryListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const language = useSettingsStore((s) => s.language);
  const [tree, setTree] = useState<CategoryNode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCategoryTree().then(setTree).finally(() => setLoading(false));
  }, []);

  const treeData = buildTreeData(tree, language, navigate);

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>{t('categories.title')}</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/categories/new')}>
          {t('categories.addCategory')}
        </Button>
      </div>

      {loading ? (
        <Spin />
      ) : treeData.length === 0 ? (
        <Empty description={t('common.noData')} />
      ) : (
        <Tree
          showIcon
          defaultExpandAll
          treeData={treeData}
          style={{ fontSize: 15 }}
        />
      )}
    </>
  );
}
