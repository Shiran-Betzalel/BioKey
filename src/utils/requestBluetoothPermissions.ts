import { PermissionsAndroid, Platform } from 'react-native';
import {PERMISSIONS, request, RESULTS} from 'react-native-permissions';

export const requestBluetoothPermissions = async () => {
  try {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.CAMERA,
      ]);

      const allGranted = Object.values(granted).every(
        result => result === PermissionsAndroid.RESULTS.GRANTED,
      );

      if (allGranted) {
        console.log(
          '✅ כל ההרשאות (Bluetooth + Location + Camera) ניתנו באנדרואיד',
        );
        return true;
      } else {
        console.log('❌ חלק מההרשאות באנדרואיד נדחו');
        return false;
      }
    } else if (Platform.OS === 'ios') {
      const bluetooth = await request(PERMISSIONS.IOS.BLUETOOTH);
      const location = await request(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
      const camera = await request(PERMISSIONS.IOS.CAMERA);

      const allGranted = [bluetooth, location, camera].every(
        status => status === RESULTS.GRANTED,
      );

      if (allGranted) {
        console.log(
          '✅ כל ההרשאות (Bluetooth + Location + Camera) ניתנו באייפון',
        );
        return true;
      } else {
        console.log('❌ חלק מההרשאות באייפון נדחו');
        return false;
      }
    }
  } catch (err) {
    console.warn('⚠️ שגיאה בבקשת הרשאות:', err);
    return false;
  }
};
