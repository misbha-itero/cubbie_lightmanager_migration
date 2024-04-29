import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ProgressBarAndroid,
  Alert
} from 'react-native';
import assets from '../assets';
import {
  findLightIp,
  getConfig,
  getLightsApi,
  getUserName
} from '../services/LightService';
import { getStoredData, storeData } from '../storage/LocalStorage';
import { Constant } from '../constants/Strings';
import { millisecondsToMinutes, showToast } from '../utils/Util';
import { setLightList } from '../state/Lights';
import store from '../state';

function PHPushLinkScreen({ navigation }) {
  const [progress, setProgress] = useState(0);
  const [ipAddress, setIpAddress] = useState<string>('');
  const [bridgeName, setBridgeName] = useState<string>('');
  const [isStartHandler, setIsStartHandler] = useState(false);

  useEffect(() => {
    getStoredData(Constant.IP_ADDRESS).then(ip => {
      setIpAddress(ip);
      getStoredData(Constant.BRIDGE_NAME).then(bridge => {
        setBridgeName(bridge);
        console.log('ip_bridge', ip + '----' + bridge);
        startHandler();
      });
    });
  }, []);

  useEffect(() => {
    let interval: any;
    if (isStartHandler) {
      interval = setInterval(() => {
        if (isStartHandler) {
          getUserNameApi(ipAddress, bridgeName);
          setProgress(prevProgress => prevProgress + 1);
        }
      }, 3000); // 1000 milliseconds = 1 second
    }
    return () => clearInterval(interval);
  }, [isStartHandler]);

  const startHandler = () => {
    setIsStartHandler(true);
  };

  const stopHandler = () => {
    setIsStartHandler(false);
  };

  const getIpAddress = async () => {
    try {
      const result = await findLightIp();
      if (result?.length > 0) {
        setIpAddress(result[0].internalipaddress);
        await storeData(Constant.IP_ADDRESS, result[0].internalipaddress);
        await storeData(Constant.ID, result[0].id);
        getConfigData(result[0].internalipaddress);
      } else if (result?.status === 429 && result?.headers) {
        const retryAfterValue = millisecondsToMinutes(
          result.headers['retry-after']
        );
        showToast('Please retry after ' + retryAfterValue);
      } else {
        showToast('Unable to find IP Address');
      }
    } catch (error) {
      showWentWrong();
      console.log('getIpAddress_error', error);
    }
  };

  const getConfigData = async (ipAddress: string) => {
    try {
      const result = await getConfig(ipAddress);
      console.log('getConfigData_result', result);
      if ('name' in result) {
        getUserNameApi(ipAddress, result.name);
      } else if (isErrorResponse(result)) {
        handleErrorResponse(result);
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
      } else if (
        Array.isArray(result) &&
        result.length > 0 &&
        'success' in result[0]
      ) {
        storeData(Constant.USER_NAME, result[0].success.username);
        stopHandler();
        showToast('Authentication Succeeded');
        console.log('username', result[0].success.username);
        getLights(ip, result[0].success.username);
      } else {
        showWentWrong();
      }
    } catch (error) {
      showWentWrong();
      stopHandler();
      console.log('getUserNameApi', error);
    }
  };

  const getLights = async (ip: any, userName: string) => {
    try {
      const result = await getLightsApi(ip, userName);
      console.log('getLights_result', result);
      if (isErrorResponse(result)) {
        handleErrorResponse(result);
      } else {
        const filteredKeys = Object.keys(result);
        await storeData(Constant.LIGHT_NAME, filteredKeys.length + '');
        store.dispatch(setLightList(result));
        stopHandler();
        redirectToPHLights();
      }
    } catch (error) {
      showWentWrong();
      console.log('getLights_error', error);
    }
  };

  const handleErrorResponse = (
    response: { error: { type: number; description: string } }[]
  ) => {
    if (response[0].error.type === Constant.UNAUTHORIZED_USER) {
      stopHandler();
      getConfigData(ipAddress);
    } else if (response[0].error.type === Constant.LINK_BUTTON_NOT_PRESSED) {
      startHandler();
    } else if (
      response[0].error.description.includes(Constant.FAILED_TO_CONNECT)
    ) {
      stopHandler();
      getIpAddress();
    }
  };

  const isErrorResponse = (result: any): boolean => {
    return Array.isArray(result) && result.length > 0 && 'error' in result[0];
  };

  const redirectToPHLights = () => {
    stopHandler();
    navigation.replace('PHLights');
  };

  const showWentWrong = () => {
    //Alert.alert('Something went wrong');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.textStyle}>Press the link button on the bridge</Text>
      <Image source={assets.PushLink} style={styles.imageStyle} />
      <ProgressBarAndroid
        styleAttr="Horizontal"
        indeterminate={false}
        progress={progress / 100}
      />
    </View>
  );
}

export default PHPushLinkScreen;

const styles = StyleSheet.create({
  editBtn: {
    position: 'absolute',
    bottom: -10,
    left: 0,
    padding: 5,
    justifyContent: 'center'
  },
  textStyle: {
    alignSelf: 'center',
    color: 'black',
    marginBottom: 20,
    marginTop: 20,
    fontSize: 18
  },
  imageStyle: {
    width: '100%',
    height: '80%',
    marginTop: 20,
    marginBottom: 20
  },
  container: { flex: 1, flexDirection: 'column', backgroundColor: 'white' }
});
