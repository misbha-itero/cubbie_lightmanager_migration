import AsyncStorage from '@react-native-async-storage/async-storage';

export const storeData = async (key: string, value: string) => {
  try {
    await AsyncStorage.setItem(key, value);
    console.log('Data stored successfully');
  } catch (error) {
    console.error('Error storing data:', error);
  }
};

export const getStoredData = async (key: string) => {
  try {
    const value = await AsyncStorage.getItem(key);
    if (value !== null) {
      console.log('Data retrieved successfully:', value);
      return value;
    } else {
      console.log('No data found');
      return '';
    }
  } catch (error) {
    console.error('Error retrieving data:', error);
    return '';
  }
};

export const removeData = async (key: string) => {
  try {
    await AsyncStorage.removeItem(key);
    console.log('Data removed successfully');
  } catch (error) {
    console.error('Error removing data:', error);
  }
};