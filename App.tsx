import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import React, {useState} from 'react';
import CodeScreen from './src/screens/CodeScreen/CodeScreen';
import QRScannerScreen from './src/screens/QRScannerScreen/QRScannerScreen';
import {BleManager, Device} from 'react-native-ble-plx';

export type RootStackParamList = {
  QRScanner: undefined;
  Code: {
    connectedDevice: Device;
    macAddress: string;
    decryptedBuffer: any;
  };
};

const Stack = createStackNavigator<RootStackParamList>();

const App = () => {
  const [bleManager] = useState(new BleManager());
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="QRScanner">
        <Stack.Screen
          name="QRScanner"
          options={{title: "סריקת QR עבור חיבור לבלוטות'"}}>
          {props => (
            <QRScannerScreen
              {...props}
              bleManager={bleManager}
              connectedDevice={connectedDevice}
              setConnectedDevice={setConnectedDevice}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="Code" options={{title: 'הזן קוד רכב'}}>
          {props => (
            <CodeScreen
              {...props}
              bleManager={bleManager}
              connectedDevice={connectedDevice}
            />
          )}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
