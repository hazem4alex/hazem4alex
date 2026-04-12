import { useState } from 'react';
import { Upload, Button, List, Popconfirm, Typography, message } from 'antd';
import { UploadOutlined, DeleteOutlined, DownloadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { uploadFile, deleteFile, getFileUrl } from '../../api/files';

const { Text } = Typography;

interface RemoteFile {
  id: number;
  originalFileName: string;
  mimeType: string;
  fileSizeBytes: number;
  uploadedAt: string;
  uploadedByName_AR: string;
  uploadedByName_EN: string;
}

interface Props {
  documentId: number;
  existingFiles?: RemoteFile[];
  language: string;
  onFilesChanged?: () => void;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FileUploadArea({ documentId, existingFiles = [], language, onFilesChanged }: Props) {
  const { t } = useTranslation();
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState<RemoteFile[]>(existingFiles);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const result = await uploadFile(documentId, file);
      setFiles((prev) => [...prev, result]);
      onFilesChanged?.();
      message.success(`${file.name} ${t('common.success')}`);
    } catch {
      message.error(t('common.error'));
    } finally {
      setUploading(false);
    }
    return false; // prevent default antd upload
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteFile(id);
      setFiles((prev) => prev.filter((f) => f.id !== id));
      onFilesChanged?.();
      message.success(t('common.success'));
    } catch {
      message.error(t('common.error'));
    }
  };

  return (
    <div>
      <Upload
        beforeUpload={(file) => { handleUpload(file); return false; }}
        showUploadList={false}
        multiple
      >
        <Button icon={<UploadOutlined />} loading={uploading}>
          {t('documents.uploadFile')}
        </Button>
      </Upload>

      <List
        style={{ marginTop: 12 }}
        dataSource={files}
        renderItem={(f) => (
          <List.Item
            actions={[
              <Button
                key="dl"
                type="link"
                icon={<DownloadOutlined />}
                href={getFileUrl(f.id)}
                target="_blank"
              >
                {t('common.download')}
              </Button>,
              <Popconfirm
                key="del"
                title={t('files.deleteConfirm')}
                onConfirm={() => handleDelete(f.id)}
              >
                <Button type="link" danger icon={<DeleteOutlined />}>
                  {t('common.delete')}
                </Button>
              </Popconfirm>,
            ]}
          >
            <List.Item.Meta
              title={f.originalFileName}
              description={
                <Text type="secondary">
                  {formatBytes(f.fileSizeBytes)} — {new Date(f.uploadedAt).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')}
                </Text>
              }
            />
          </List.Item>
        )}
      />
    </div>
  );
}
