import React, {useEffect, useRef, useState} from 'react';
import {Alert, Text, View, useWindowDimensions} from 'react-native';
import {BleManager, Device, Subscription} from 'react-native-ble-plx';
import {
  ReactNativeScannerView,
  Commands,
} from '@pushpendersingh/react-native-scanner';
import {requestBluetoothPermissions} from '../../utils/requestBluetoothPermissions';
import {requestCameraPermission} from '../../utils/requestCameraPermissions';
import {
  buildCurrentFingerprintMessage,
  characteristicsRXUUID,
  characteristicsTXUUID,
  serviceUUID,
  subscribeOrPollNotifications,
} from '../../utils/bluetoothFunction';
import {Buffer} from 'buffer';
import {styles} from './QrScannerScreen.style';
import Screen from '../../components/Screen/Screen';
import CustomButton from '../../components/CustomButton/CustomButton';
import {useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList} from '../../../App';
import {QRScannerScreenType} from './QRScannerScreen.type';

type NavigationProp = StackNavigationProp<RootStackParamList, 'QRScanner'>;

const QRScannerScreen = (props: QRScannerScreenType) => {
  const {bleManager} = props;
  const {height, width} = useWindowDimensions();
  const navigation = useNavigation<NavigationProp>();
  const scannerRef = useRef(null);
  const [isActive, setIsActive] = useState(false);
  const [device, setDevice] = useState<Device | null>(null);
  const [notificationData, setNotificationData] = useState<any>(null);
  const [isBluetoothOn, setIsBluetoothOn] = useState<boolean | null>(null);
  const [connectionInterval, setConnectionInterval] =
    useState<NodeJS.Timeout | null>(null);

  const connectToDevice = async (macAddress: string) => {
    bleManager.startDeviceScan(null, null, async (error, scannedDevice) => {
      if (error) {
        console.warn('שגיאה בסריקה:', error);
        return;
      }

      if (scannedDevice?.localName?.startsWith('BIOL')) {
        bleManager.stopDeviceScan();

        try {
          const connectedDevice = await scannedDevice.connect();
          const isConnected = await connectedDevice.isConnected();

          if (isConnected) {
            await connectedDevice.discoverAllServicesAndCharacteristics();
            setDevice(connectedDevice);

            const encryptedMessage = buildCurrentFingerprintMessage(
              2,
              macAddress,
            );

            const valueBase64 = Buffer.from(encryptedMessage, 'hex').toString(
              'base64',
            );

            await connectedDevice
              .writeCharacteristicWithResponseForService(
                serviceUUID.toLowerCase(),
                characteristicsRXUUID.toLowerCase(),
                valueBase64,
              )
              .then(() => {
                console.log('✅ המידע נשלח בהצלחה לחומרה');
              })
              .catch(error => {
                console.log('❌ שגיאה בכתיבה לחומרה:', error);
              });

            await subscribeOrPollNotifications(
              connectedDevice,
              serviceUUID.toLowerCase(),
              characteristicsTXUUID.toLowerCase(),
              macAddress,
              decryptedBuffer => {
                console.log('📬 קיבלתי מהחומרה:', decryptedBuffer);
                setNotificationData(decryptedBuffer);
                navigation.navigate('Code', {
                  connectedDevice,
                  macAddress,
                  decryptedBuffer,
                });
              },
            );
            console.log('✅ התחברת למכשיר:', connectedDevice.localName);
          } else {
            console.warn('❌ המכשיר לא מחובר');
          }
        } catch (connectError) {
          console.warn('❌ שגיאה בהתחברות:', connectError);
        }
      }
    });
  };

  const handleStartScan = async () => {
    if (!isBluetoothOn || isActive) return;
    setIsActive(true);
    scannerRef.current && Commands.startCamera(scannerRef.current);
  };

  const onQrScanned = async (event: any) => {
    const code = event.nativeEvent.data;
    const macAddressPattern = /^BTK-[A-F0-9]{12}BIO$/;
    if (macAddressPattern.test(code)) {
      const cleanCode = code
        .replace(/^BTK-/, '')
        .replace(/BIO$/, '')
        .trim()
        .toUpperCase();
      console.log('🔍 MAC שחולץ:', cleanCode);

      connectToDevice(cleanCode);
    } else {
      console.log('❌ הקוד לא תואם לפורמט MAC');

      Alert.alert(
        'שגיאה בקוד QR',
        'הקוד שסרקת לא תואם לפורמט הצפוי של כתובת MAC. נסה שוב.',
        [
          {
            text: 'אוקי',
            onPress: () => {
              setIsActive(true);
              scannerRef.current && Commands.startCamera(scannerRef.current); // הפעל את סורק ה־QR מחדש
            },
          },
        ],
      );
    }

    setIsActive(false);
  };

  const checkConnection = async (device: Device) => {
    try {
      const connected = await device.isConnected();
      if (!connected) {
        console.log('🛑 המכשיר לא מחובר, מנסה להתחבר מחדש...');
        await device.connect({autoConnect: true});
        console.log('🔵 התחברנו מחדש למכשיר');
      } else {
        console.log('✅ המכשיר מחובר');
      }
    } catch (error) {
      console.error('❌ שגיאה בחיבור:', error);
    }
  };

  const monitorConnection = (device: Device) => {
    const interval = setInterval(() => {
      checkConnection(device);
    }, 10000);
    setConnectionInterval(interval);
  };

  useEffect(() => {
    if (device) {
      monitorConnection(device);
    }

    return () => {
      if (connectionInterval) {
        clearInterval(connectionInterval);
      }
    };
  }, [device]);

  useEffect(() => {
    if (notificationData) {
      console.log(
        '📡 קיבלתי מהחומרה',
        JSON.stringify(notificationData, null, 2),
      );
    }
  }, [notificationData]);

  const requestPermissions = async () => {
    const cameraGranted = await requestCameraPermission();
    const bluetoothGranted = await requestBluetoothPermissions();

    if (!cameraGranted || !bluetoothGranted) {
      Alert.alert(
        'חובה לאשר הרשאות',
        'לא נוכל להמשיך בלי הרשאות מצלמה ו־Bluetooth.',
      );
    } else {
      console.log('✅ כל ההרשאות ניתנו');
    }
  };

  useEffect(() => {
    const stateChangeSubscription = bleManager.onStateChange(state => {
      if (state === 'PoweredOff') {
        setIsBluetoothOn(false);
        Alert.alert('Bluetooth כבוי', 'הפעל את Bluetooth כדי להתחבר');
      } else if (state === 'PoweredOn') {
        setIsBluetoothOn(true);
        console.log('✅ Bluetooth פעיל');
      }
    }, true);

    return () => {
      stateChangeSubscription.remove();
    };
  }, []);

  const checkBluetothOn = async () => {
    const state = await bleManager.state();
    if (state !== 'PoweredOn') {
      console.log('❌ Bluetooth לא מוכן. מצב:', state);
      Alert.alert('שגיאה', 'אנא הפעיל Bluetooth במכשיר');
      return;
    }
  };

  useEffect(() => {
    requestPermissions();
    checkBluetothOn();
  }, []);

  return (
    <Screen>
      {isActive ? (
        <ReactNativeScannerView
          ref={scannerRef}
          style={{height, width}}
          onQrScanned={onQrScanned}
          isActive
          showBox
        />
      ) : (
        <View style={styles.scanBox}>
          <CustomButton
            text="התחל סריקה"
            onPress={handleStartScan}
            disabled={!isBluetoothOn}
          />
          {isBluetoothOn === false && (
            <Text style={{color: 'red', marginTop: 10}}>
              יש להפעיל Bluetooth כדי לסרוק
            </Text>
          )}
        </View>
      )}
    </Screen>
  );
};

export default QRScannerScreen;
