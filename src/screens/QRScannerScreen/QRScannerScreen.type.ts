import {BleManager, Device} from 'react-native-ble-plx';

export type QRScannerScreenType = {
  bleManager: BleManager;
  connectedDevice: Device | null;
  setConnectedDevice: (device: Device) => void;
};
