import React, {useEffect, useState} from 'react';
import {View, Text, Alert} from 'react-native';
import Code from '../../components/Code/Code';
import {styles} from './CodeScreen.style';
import CustomButton from '../../components/CustomButton/CustomButton';
import Screen from '../../components/Screen/Screen';
import {
  buildCurrentFingerprintMessage,
  characteristicsRXUUID,
  characteristicsTXUUID,
  serviceUUID,
  subscribeOrPollNotifications,
} from '../../utils/bluetoothFunction';
import {
  NavigationProp,
  RouteProp,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import {RootStackParamList} from '../../../App';
import {CodeScreenType} from './CodeScreen.type';
import {Buffer} from 'buffer';

type CodeScreenRouteProp = RouteProp<RootStackParamList, 'Code'>;

const CodeScreen = (props: CodeScreenType) => {
  const {bleManager} = props;
  const navigation =
    useNavigation<NavigationProp<RootStackParamList, 'Code'>>();

  const route = useRoute<CodeScreenRouteProp>();
  const {connectedDevice, macAddress, decryptedBuffer} = route.params;

  const codeNumbers = ['1', '2', '3', '4', '5', '*'];
  const [input, setInput] = useState<string>('');
  const [notificationData, setNotificationData] = useState<any>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handlePress = (code: string) => {
    if (input.length < 5) {
      setInput(prevInput => prevInput + code);
    }
  };

  const handleDelete = () => {
    setInput('');
  };

  const handleSave = async () => {
    if (input.length !== 5) {
      Alert.alert('⚠️ יש להזין קוד בן 5 ספרות');
      return;
    }

    if (!connectedDevice) {
      Alert.alert('שגיאה', 'אין חיבור למכשיר BLE');
      return;
    }

    const encryptedMessage50 = buildCurrentFingerprintMessage(
      50,
      macAddress,
      input,
      decryptedBuffer,
    );

    const valueBase64_50 = Buffer.from(encryptedMessage50, 'hex').toString(
      'base64',
    );

    await connectedDevice
      .writeCharacteristicWithResponseForService(
        serviceUUID.toLowerCase(),
        characteristicsRXUUID.toLowerCase(),
        valueBase64_50,
      )
      .then(() => {
        console.log('✅ המידע נשלח בהצלחה לחומרה');
      })
      .catch(error => {
        console.log('❌ שגיאה בכתיבה לחומרה:', error);
      });

    const encryptedMessage51 = buildCurrentFingerprintMessage(
      51,
      macAddress,
      input,
      decryptedBuffer,
    );

    const valueBase64_51 = Buffer.from(encryptedMessage51, 'hex').toString(
      'base64',
    );

    await connectedDevice
      .writeCharacteristicWithResponseForService(
        serviceUUID.toLowerCase(),
        characteristicsRXUUID.toLowerCase(),
        valueBase64_51,
      )
      .then(() => {
        console.log('✅ המידע נשלח בהצלחה לחומרה');
      })
      .catch(error => {
        console.log('❌ שגיאה בכתיבה לחומרה:', error);
      });

    Alert.alert(' הקוד נשמר בהצלחה', `הקוד שהוזן: ${input}`);

    try {
      await connectedDevice.cancelConnection();
      console.log('🔌 התנתקת מהמכשיר');
    } catch (error) {
      console.log('❌ שגיאה בניתוק:', error);
    }

    setInput('');
    navigation.navigate('QRScanner');
  };

  useEffect(() => {
    if (notificationData) {
      console.log(
        '📡 קיבלתי מהחומרה',
        JSON.stringify(notificationData, null, 2),
      );
    }
  }, [notificationData]);

  useEffect(() => {
    if (!connectedDevice) return;

    const subscription = connectedDevice.onDisconnected((error, device) => {
      console.log('🔌 נותקתי מהחומרה');
      console.log('אופס', 'החיבור למכשיר נותק');
    });

    return () => {
      subscription?.remove();
    };
  }, [connectedDevice]);

  useEffect(() => {
    const subscribe = async () => {
      try {
        if (connectedDevice && !isSubscribed) {
          await subscribeOrPollNotifications(
            connectedDevice,
            serviceUUID.toLowerCase(),
            characteristicsTXUUID.toLowerCase(),
            macAddress,
            decryptedBuffer => {
              console.log('📬 קיבלתי מהחומרה:', decryptedBuffer);
              setNotificationData(decryptedBuffer);
            },
          );
          setIsSubscribed(true);
        }
      } catch (error) {
        console.log('❌ שגיאה בהרשמה להתראות:', error);
      }
    };

    subscribe();
  }, [connectedDevice]);

  useEffect(() => {
    const verifyConnection = async () => {
      if (!connectedDevice) return;
      const isStillConnected = await connectedDevice.isConnected();
      if (!isStillConnected) {
        Alert.alert('חיבור נותק', 'המכשיר כבר לא מחובר');
      }
    };

    verifyConnection();
  }, []);

  return (
    <Screen>
      <View style={styles.container}>
        <Code codeNumbers={codeNumbers} onPress={handlePress} />
        <View style={styles.inputRow}>
          {[...Array(5)].map((_, i) => (
            <View key={i} style={styles.codeBox}>
              <Text style={styles.codeDigit}>{input[i] || ''}</Text>
              <View style={styles.underline} />
            </View>
          ))}
        </View>
        <View style={styles.btnContainer}>
          <CustomButton
            text="מחק"
            onPress={() => handleDelete()}
            disabled={input.length === 0}
          />
          <CustomButton
            text="שמור"
            onPress={() => handleSave()}
            disabled={input.length !== 5}
          />
        </View>
      </View>
    </Screen>
  );
};

export default CodeScreen;
