import {StyleSheet} from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#0c0c0c',
    borderRadius: 15,
  },
  button: {
    backgroundColor: '#0c0c0c',
    paddingVertical: 16,
    paddingHorizontal: 0,
    borderRadius: 12,
    borderColor: 'white',
    borderWidth: 1,
    width: '30%',
    marginVertical: 10,
  },
  text: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 18,
  },
});
