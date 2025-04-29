import {BleManager, Device} from 'react-native-ble-plx';

export type CodeScreenType = {
  bleManager: BleManager;
  connectedDevice: Device | null;
//   setConnectedDevice: (device: Device) => void;
};
