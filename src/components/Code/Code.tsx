import React from 'react';
import {View} from 'react-native';
import CustomButton from '../CustomButton/CustomButton';
import {styles} from './Code.style';

const Code = (props: CodeType) => {
  const {onPress, codeNumbers} = props;

  return (
    <View style={styles.container}>
      {codeNumbers?.map((code, index) => (
        <CustomButton
          customBtnStyle={styles.button}
          customTxtStyle={styles.text}
          key={index}
          text={code}
          onPress={() => onPress(code)}
        />
      ))}
    </View>
  );
};

export default Code;
