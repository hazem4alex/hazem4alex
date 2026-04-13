import client from './client';

export interface ScanDevice {
  id: string;
  name: string;
}

export interface ScanSettings {
  deviceId: string;
  resolution: number;
  colorMode: string;
}

export interface ScanResult {
  format: string;
  base64: string;
}

export const getScanDevices = (): Promise<ScanDevice[]> =>
  client.get<ScanDevice[]>('/scan/devices').then((r) => r.data);

export const scanDocument = (settings: ScanSettings): Promise<ScanResult> =>
  client.post<ScanResult>('/scan', settings).then((r) => r.data);
