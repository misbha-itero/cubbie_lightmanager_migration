import * as Keychain from 'react-native-keychain';

/** With internet credentials */
const setSecureValue = (
  key: string,
  value: string
): Promise<false | Keychain.Result> =>
  Keychain.setInternetCredentials(key, key, value);

const getSecureValue = async (key: string): Promise<string | false> => {
  const result = await Keychain.getInternetCredentials(key);
  if (result) {
    return result.password;
  }
  return false;
};

const removeSecureValue = (key: string): Promise<void> =>
  Keychain.resetInternetCredentials(key);

export default { setSecureValue, getSecureValue, removeSecureValue };
