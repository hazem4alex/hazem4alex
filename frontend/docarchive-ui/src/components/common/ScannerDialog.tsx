import { useEffect, useState } from 'react';
import { Modal, Select, Button, Space, Alert, Spin, Image, Typography, Row, Col } from 'antd';
import { ScanOutlined, ReloadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { getScanDevices, scanDocument, ScanDevice } from '../../api/scan';

const { Text } = Typography;

const RESOLUTIONS = [75, 150, 300, 600];
const COLOR_MODES = ['Color', 'Grayscale', 'BlackAndWhite'] as const;

interface Props {
  open: boolean;
  onClose: () => void;
  /** Called with the scanned image as a File so the caller can upload / queue it. */
  onScanned: (file: File) => void;
}

function base64ToFile(base64: string, filename: string): File {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new File([bytes], filename, { type: 'image/jpeg' });
}

export default function ScannerDialog({ open, onClose, onScanned }: Props) {
  const { t } = useTranslation();

  const [loadingDevices, setLoadingDevices] = useState(false);
  const [devices, setDevices] = useState<ScanDevice[]>([]);
  const [deviceId, setDeviceId] = useState<string>('');
  const [resolution, setResolution] = useState(300);
  const [colorMode, setColorMode] = useState<string>('Color');

  const [scanning, setScanning] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load devices whenever the dialog opens
  useEffect(() => {
    if (!open) return;
    setPreview(null);
    setError(null);
    setLoadingDevices(true);
    getScanDevices()
      .then((list) => {
        setDevices(list);
        if (list.length > 0) setDeviceId(list[0].id);
      })
      .catch(() => setError(t('scanner.loadError')))
      .finally(() => setLoadingDevices(false));
  }, [open]);

  const handleScan = async () => {
    if (!deviceId) return;
    setScanning(true);
    setPreview(null);
    setError(null);
    try {
      const result = await scanDocument({ deviceId, resolution, colorMode });
      setPreview(`data:image/jpeg;base64,${result.base64}`);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? t('common.error');
      setError(msg);
    } finally {
      setScanning(false);
    }
  };

  const handleUse = () => {
    if (!preview) return;
    const base64 = preview.replace('data:image/jpeg;base64,', '');
    const filename = `scan_${new Date().toISOString().replace(/[:.]/g, '-')}.jpg`;
    onScanned(base64ToFile(base64, filename));
    onClose();
  };

  const handleRescan = () => {
    setPreview(null);
    setError(null);
  };

  const handleClose = () => {
    setPreview(null);
    setError(null);
    onClose();
  };

  const footer = preview
    ? [
        <Button key="rescan" icon={<ReloadOutlined />} onClick={handleRescan}>
          {t('scanner.rescan')}
        </Button>,
        <Button key="use" type="primary" icon={<ScanOutlined />} onClick={handleUse}>
          {t('scanner.useScan')}
        </Button>,
      ]
    : [
        <Button key="cancel" onClick={handleClose}>
          {t('common.cancel')}
        </Button>,
        <Button
          key="scan"
          type="primary"
          icon={<ScanOutlined />}
          loading={scanning}
          disabled={!deviceId || loadingDevices}
          onClick={handleScan}
        >
          {scanning ? t('scanner.scanning') : t('scanner.scan')}
        </Button>,
      ];

  return (
    <Modal
      open={open}
      title={t('scanner.title')}
      onCancel={handleClose}
      footer={footer}
      width={640}
      destroyOnClose
    >
      {loadingDevices && (
        <div style={{ textAlign: 'center', padding: 32 }}>
          <Spin />
        </div>
      )}

      {!loadingDevices && devices.length === 0 && !error && (
        <Alert type="warning" showIcon message={t('scanner.noDevices')} />
      )}

      {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 12 }} />}

      {!loadingDevices && devices.length > 0 && !preview && (
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Row gutter={16}>
            <Col span={24}>
              <Text type="secondary">{t('scanner.selectDevice')}</Text>
              <Select
                style={{ width: '100%', marginTop: 4 }}
                value={deviceId}
                onChange={setDeviceId}
                options={devices.map((d) => ({ value: d.id, label: d.name }))}
              />
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Text type="secondary">{t('scanner.resolution')}</Text>
              <Select
                style={{ width: '100%', marginTop: 4 }}
                value={resolution}
                onChange={setResolution}
                options={RESOLUTIONS.map((r) => ({ value: r, label: `${r} DPI` }))}
              />
            </Col>
            <Col span={12}>
              <Text type="secondary">{t('scanner.colorMode')}</Text>
              <Select
                style={{ width: '100%', marginTop: 4 }}
                value={colorMode}
                onChange={setColorMode}
                options={COLOR_MODES.map((m) => ({
                  value: m,
                  label: t(`scanner.colorModes.${m}`),
                }))}
              />
            </Col>
          </Row>
        </Space>
      )}

      {preview && (
        <div style={{ textAlign: 'center' }}>
          <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
            {t('scanner.preview')}
          </Text>
          <Image src={preview} style={{ maxHeight: 400, objectFit: 'contain' }} />
        </div>
      )}
    </Modal>
  );
}
