import {Device} from 'react-native-ble-plx';
import {Buffer} from 'buffer';
import CryptoJS from 'crypto-js';

export const serviceUUID = '6E400001-B5A3-F393-E0A9-E50E24DCCA9E';
export const characteristicsRXUUID = '6E400002-B5A3-F393-E0A9-E50E24DCCA9E';
export const characteristicsTXUUID = '6E400003-B5A3-F393-E0A9-E50E24DCCA9E';

export const buildAesKey = (macString: string) => {
  if (macString.length !== 12) {
    throw new Error('MAC לא חוקי');
  }

  const baseKey = 'FingerL-LeAcH010'.split('');
  const keyBytes = Buffer.alloc(32);
  for (let i = 0; i < 16; i++) {
    keyBytes[i] = baseKey[i].charCodeAt(0);
  }
  for (let i = 16; i <= 21; i++) {
    keyBytes[i] = 0;
  }
  const macBytes = macString.match(/.{2}/g)?.map(x => parseInt(x, 16));
  if (!macBytes) throw new Error('פירוק MAC נכשל');

  let macSum = macBytes.reduce((acc, val) => acc + val, 0) + 0x15;
  let passwordOffset = (macSum & 1) === 0 ? 2 : 1;

  const user_password = [
    ((macSum >> 3) & 3) + passwordOffset,
    ((macSum >> 2) & 3) + 1,
    ((macSum >> 1) & 3) + 1,
    (macSum & 3) + 1,
  ];

  const forbidden = [
    [1, 1, 1, 1],
    [2, 2, 2, 2],
    [3, 3, 3, 3],
    [4, 4, 4, 4],
    [5, 5, 5, 5],
    [1, 2, 3, 4],
    [4, 3, 2, 1],
  ];

  if (forbidden.some(fb => fb.every((v, i) => v === user_password[i]))) {
    user_password[2] = 1;
    user_password[3] = 2;
  }

  for (let i = 0; i < 4; i++) {
    keyBytes[22 + i] = user_password[i];
  }
  for (let i = 0; i < 6; i++) {
    keyBytes[26 + i] = macBytes[i];
  }

  return CryptoJS.lib.WordArray.create(keyBytes);
};

export const buildCurrentFingerprintMessage = (
  messageType: number,
  macAddress: string,
  input?: string,
  decryptedBuffer?: any,
) => {
  const buffer = Buffer.alloc(16, 0);
  const now = new Date();
  buffer[0] = messageType & 0xff;
  buffer[1] = now.getFullYear() % 100;
  buffer[2] = now.getMonth() + 1;
  buffer[3] = now.getDate();
  buffer[4] = now.getHours();
  buffer[5] = now.getMinutes();
  buffer[6] = now.getSeconds();

  switch (messageType) {
    case 2:
      break;
    case 50:
      buffer[7] = 1;
      if (input && input.length === 5) {
        for (let i = 0; i < 6; i++) {
          buffer[8 + i] = parseInt(input[i], 10);
        }
      }
      buffer[13] = decryptedBuffer[13];
      buffer[14] = decryptedBuffer[14];
      break;
    case 51:
      if (input && input.length === 5) {
        for (let i = 0; i < 6; i++) {
          buffer[7 + i] = parseInt(input[i], 10);
        }
      }
      buffer[13] = decryptedBuffer[13];
      buffer[14] = decryptedBuffer[14];
      break;
    default:
      break;
  }

  let sum = 0;
  for (let i = 0; i < 15; i++) sum += buffer[i];
  buffer[15] = (~sum + 1) & 0xff;

  const wordArray = CryptoJS.lib.WordArray.create(buffer);
  const encrypted = CryptoJS.AES.encrypt(wordArray, buildAesKey(macAddress), {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.NoPadding,
  });

  return encrypted.ciphertext.toString(CryptoJS.enc.Hex);
};

export const parseFingerprintNotification = (decryptedBuffer: Buffer) => {
  if (decryptedBuffer.length !== 16) {
    throw new Error('אורך הודעה שגוי');
  }

  return {
    type: decryptedBuffer[0],
    date: `20${decryptedBuffer[1]
      .toString()
      .padStart(2, '0')}-${decryptedBuffer[2]
      .toString()
      .padStart(2, '0')}-${decryptedBuffer[3].toString().padStart(2, '0')}`,
    time: `${decryptedBuffer[4]
      .toString()
      .padStart(2, '0')}:${decryptedBuffer[5]
      .toString()
      .padStart(2, '0')}:${decryptedBuffer[6].toString().padStart(2, '0')}`,
  };
};

const decryptBuffer = async (encryptedBuffer: Buffer, macAddress: string) => {
  const decryptedHex = CryptoJS.AES.decrypt(
    {
      ciphertext: CryptoJS.enc.Hex.parse(encryptedBuffer.toString('hex')),
    } as CryptoJS.lib.CipherParams,
    buildAesKey(macAddress),
    {mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.NoPadding},
  ).toString(CryptoJS.enc.Hex);

  return Buffer.from(decryptedHex, 'hex');
};

export const subscribeOrPollNotifications = (
  device: Device,
  serviceUUID: string,
  characteristicUUID: string,
  macAddress: string,
  onNotification: (value: string | any) => void,
) => {
  try {
    const subscription = device.monitorCharacteristicForService(
      serviceUUID,
      characteristicUUID,
      async (error, characteristic) => {
        if (error) {
          console.log('❌ שגיאה בהפעלת התראות:', error);
          return;
        }

        if (characteristic?.value) {
          const encryptedBuffer = Buffer.from(characteristic.value, 'base64');
          const decryptedBuffer: Buffer = await decryptBuffer(
            encryptedBuffer,
            macAddress,
          );
          onNotification(decryptedBuffer);
        }
      },
    );

    console.log('✅ נרשמתי להודעות BLE');
    return subscription; // תחזירי את ה־subscription כדי שתוכלי לבטל אם תרצי
  } catch (error) {
    console.log('❌ שגיאה בהרשמה להתראות:', error);
  }
};
