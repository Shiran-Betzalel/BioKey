import {Platform} from 'react-native';
import {request, PERMISSIONS, RESULTS} from 'react-native-permissions';

export const requestCameraPermission = async () => {
  const result = await request(
    Platform.OS === 'ios' ? PERMISSIONS.IOS.CAMERA : PERMISSIONS.ANDROID.CAMERA,
  );

  if (result === RESULTS.GRANTED) {
    console.log('✅ הרשאת מצלמה ניתנה');
    return true;
  } else {
    console.log('❌ הרשאת מצלמה נדחתה');
    return false;
  }
};
