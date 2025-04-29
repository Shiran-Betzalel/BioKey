import {StyleSheet} from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    padding: 50,
  },
  btnContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 50,
    width: '100%',
  },
  inputText: {
    fontSize: 30,
    width: 100,
    textAlign: 'center',
    borderBottomColor: '#0c0c0c',
    verticalAlign: 'bottom',
    borderBottomWidth: 5,
  },
  inputRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    marginTop: 40,
    width: '80%',
  },
  codeBox: {
    alignItems: 'center',
    width: 40,
  },
  codeDigit: {
    fontSize: 30,
    color: '#0c0c0c',
    marginBottom: 5,
  },
  underline: {
    height: 3,
    width: '100%',
    backgroundColor: '#0c0c0c',
  },
});
