import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  StatusBar
} from 'react-native';
import {
  findLightIp,
  getConfig,
  getLightsApi,
  getUserName
} from '../services/LightService';
import { getStoredData, storeData } from '../storage/LocalStorage';
import { Constant } from '../constants/Strings';
import { millisecondsToMinutes, showToast } from '../utils/Util';
import store from '../state';
import { setLightList } from '../state/Lights';

function PHHomeScreen({ navigation }) {
  const [ipAddress, setIpAddress] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [bridgeMac, setBridgeMac] = useState<string>('');
  const [bridgeName, setBridgeName] = useState<string>('');

  useEffect(() => {
    getStoredData(Constant.IP_ADDRESS).then(result => {
      setIpAddress(result);
      getStoredData(Constant.ID).then(result => {
        setBridgeMac(result);
        getStoredData(Constant.USER_NAME).then(result => {
          setUserName(result);
        });
      });
    });
  }, []);

  useEffect(() => {
    if (ipAddress.length > 0 && userName.length > 0) {
      getLights(userName);
    } else if (ipAddress.length > 0) {
      getConfigData(ipAddress);
    } else {
      getIpAddress();
    }
  }, [userName]);

  const getIpAddress = async () => {
    try {
      const result = await findLightIp();
      console.log('getIpAddress', result);
      if (result?.length > 0) {
        setIpAddress(result[0].internalipaddress);
        setBridgeMac(result[0].id);
        await storeData(Constant.IP_ADDRESS, result[0].internalipaddress);
        await storeData(Constant.ID, result[0].id);
        getConfigData(result[0].internalipaddress);
      } else if (result?.status === 429 && result?.headers) {
        retryAfter(result);
      } else {
        showToast('Unable to find IP Address');
      }
    } catch (error) {
      showWentWrong();
      console.log('getIpAddress_error', error);
    }
  };

  const getConfigData = async (ip: string) => {
    try {
      const result = await getConfig(ip);
      console.log('getConfigData_result', result);
      setBridgeName(result.name);
      if ('name' in result) {
        await storeData(Constant.BRIDGE_NAME, result.name);
        getUserNameApi(ip, result.name);
      } else if (isErrorResponse(result)) {
        handleErrorResponse(result);
      } else if (result?.status === 429 && result?.headers) {
        retryAfter(result);
      } else {
        showWentWrong();
      }
    } catch (error) {
      showWentWrong();
      console.log('getConfigData_error', error);
    }
  };

  const getUserNameApi = async (ip: string, bridge: string) => {
    try {
      const result = await getUserName(ip, bridge);
      console.log('getUserNameApi', result);
      if (isErrorResponse(result)) {
        handleErrorResponse(result);
      } else if ('success' in result) {
        await storeData(Constant.USER_NAME, result.success.username);
        redirectToPHLights();
      } else if (result?.status === 429 && result?.headers) {
        retryAfter(result);
      } else {
        showWentWrong();
      }
    } catch (error) {
      showWentWrong();
      console.log('getConfigData_error', error);
    }
  };

  const getLights = async (user: string) => {
    try {
      const result = await getLightsApi(ipAddress, user);
      console.log('getLights_result_2', result);
      if (isErrorResponse(result)) {
        handleErrorResponse(result);
      } else if (result.hasOwnProperty('1')) {
        const filteredKeys = Object.keys(result);
        await storeData(Constant.LIGHT_NAME, filteredKeys.length + '');
        store.dispatch(setLightList(result));
        setTimeout(redirectToPHLights, 2000);
      } else if (result?.status === 429 && result?.headers) {
        retryAfter(result);
      } else {
        showWentWrong();
      }
    } catch (error) {
      showWentWrong();
      console.log('getLights_error', error);
    }
  };

  const showWentWrong = () => {
    //Alert.alert('Something went wrong');
  };

  const handleErrorResponse = (
    response: { error: { type: number; description: string } }[]
  ) => {
    console.log('handleerrorresponse', response);
    if (response[0].error.type === Constant.UNAUTHORIZED_USER) {
      getConfigData(ipAddress);
    } else if (response[0].error.type === Constant.LINK_BUTTON_NOT_PRESSED) {
      reDirectToAuthenticate();
    } else if (
      response[0].error.description.includes(Constant.FAILED_TO_CONNECT)
    ) {
      getIpAddress();
    }
  };

  const handleIpClick = async () => {
    if (userName.length > 0) {
      getLights(userName);
    } else {
      getConfigData(ipAddress);
    }
  };

  const redirectToPHLights = () => {
    navigation.replace('PHLights');
  };

  const reDirectToAuthenticate = () => {
    navigation.replace('PHPushLink');
  };

  const isErrorResponse = (result: any): boolean => {
    return Array.isArray(result) && result.length > 0 && 'error' in result[0];
  };

  const retryAfter = (result: { headers: { [x: string]: number } }) => {
    const retryAfterValue = millisecondsToMinutes(
      result.headers['retry-after']
    );
    showToast('Please retry after ' + retryAfterValue);
  };

  return (
    <View style={styles.parentContainer}>
      <StatusBar
        backgroundColor="#0277bd" // Change this to your desired color
        barStyle="light-content" // You can also set it to 'dark-content' if your background is light
      />
      <Text style={styles.textStyle}>
        Please select a bridge to use for this app
      </Text>
      <View style={{ height: '75%' }}>
        {ipAddress.length > 0 && (
          <TouchableOpacity
            style={styles.ipContainer}
            onPress={() => {
              handleIpClick();
            }}>
            <Text style={styles.ipTextStyle}>{ipAddress}</Text>
            <Text style={styles.idTextStyle}>{bridgeMac}</Text>
          </TouchableOpacity>
        )}
      </View>
      <TouchableOpacity
        style={styles.buttonStyle}
        onPress={() => {
          getIpAddress();
        }}>
        <Text style={styles.buttonText}>Find IP</Text>
      </TouchableOpacity>
    </View>
  );
}

export default PHHomeScreen;

const styles = StyleSheet.create({
  parentContainer: { flex: 1, backgroundColor: 'white' },
  ipContainer: {
    flexDirection: 'column',
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#F1F1F1'
  },
  buttonStyle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    bottom: 0,
    left: 0,
    right: 0,
    alignSelf: 'flex-end',
    alignContent: 'flex-end',
    alignItems: 'flex-end',
    margin: 20,
    justifyContent: 'center',
    backgroundColor: '#0277bd'
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    alignSelf: 'center',
    fontWeight: 'bold'
  },
  ipTextStyle: {
    fontSize: 20,
    fontWeight: 'bold'
  },
  idTextStyle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 5,
    textTransform: 'uppercase'
  },
  textStyle: {
    alignSelf: 'center',
    color: 'black',
    marginBottom: 20,
    marginTop: 20,
    fontSize: 14
  }
});
