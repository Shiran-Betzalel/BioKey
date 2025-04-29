import React from 'react';
import {Text, TouchableOpacity} from 'react-native';
import {styles} from './CustomButton.style';

const CustomButton = (props: CustomButtonType) => {
  const {
    onPress = () => {},
    text = '',
    customBtnStyle,
    customTxtStyle,
    disabled = false,
  } = props;

  return (
    <TouchableOpacity
      disabled={disabled}
      onPress={onPress}
      style={[styles.button, {...customBtnStyle}, disabled && styles.disabled]}>
      <Text style={[styles.text, {...customTxtStyle}]}>{text}</Text>
    </TouchableOpacity>
  );
};

export default CustomButton;
