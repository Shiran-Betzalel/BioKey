import React from 'react';
import {ImageBackground} from 'react-native';
import {styles} from './Screen.style';
import {ScreenType} from './Screen.type';

const Screen = (props: ScreenType) => {
  const {children} = props;

  return (
    <ImageBackground
      source={require('../../assets/images/car.jpg')}
      style={styles.container}
      resizeMode="cover">
      {children}
    </ImageBackground>
  );
};

export default Screen;
