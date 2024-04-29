import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert
} from 'react-native';
import assets from '../assets';
import { getStoredData, storeData } from '../storage/LocalStorage';
import { Constant } from '../constants/Strings';
import {
  adjustLightBrightness,
  changeLightColor,
  findLightIp,
  getConfig,
  getLightsApi,
  getUserName,
  onOffLight
} from '../services/LightService';
import { millisecondsToMinutes, showToast } from '../utils/Util';
import { setLightList } from '../state/Lights';
import store, { RootState } from '../state';
import { useDispatch, useSelector } from 'react-redux';
import { toXY } from '../utils/ColorUtil';
import database from '@react-native-firebase/database';
import { setIsIntervalRunning } from '../state/LightControls';

function PHLights({ navigation }) {
  const [ipAddress, setIpAddress] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const { lightList }: any = useSelector((state: RootState) => state.lightList);
  const { isIntervalRunning }: any = useSelector(
    (state: RootState) => state.lightControls
  );
  const [onLight, setOnLight] = useState(true);
  const dispatch = useDispatch();

  useEffect(() => {
    getStoredData(Constant.IP_ADDRESS).then(ip => {
      setIpAddress(ip);
      getStoredData(Constant.USER_NAME).then(userName => {
        setUserName(userName);
        callAPIs(ip, userName);
      });
    });
  }, []);

  useEffect(() => {
    let interval: any;
    var progress = 1;
    if (isIntervalRunning) {
      interval = setInterval(() => {
        console.log('progress', progress);
        if (progress === 1) {
          progress = 2;
          changeHueLightColor(255, 0, 0);
        } else if (progress === 2) {
          progress = 3;
          changeHueLightColor(255, 255, 0);
        } else if (progress === 3) {
          progress = 4;
          changeHueLightColor(255, 192, 203);
        } else if (progress === 4) {
          progress = 5;
          changeHueLightColor(0, 128, 0);
        } else if (progress === 5) {
          progress = 6;
          changeHueLightColor(255, 165, 0);
        } else if (progress === 6) {
          progress = 1;
          changeHueLightColor(0, 0, 255);
        }
      }, 5000); // 1000 milliseconds = 1 second
    }
    return () => clearInterval(interval);
  }, [isIntervalRunning]);

  const callAPIs = (ip: any, user: string) => {
    if (ip.length > 0 && user.length > 0) {
      getLights(ip, user);
    }
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

  const getConfigData = async (ip: any) => {
    try {
      const result = await getConfig(ip);
      console.log('getConfigData_result', result);
      if ('name' in result) {
        getUserNameApi(ip, result.name);
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

  const getUserNameApi = async (ip: any, bridgeName: string) => {
    try {
      const result = await getUserName(ip, bridgeName);
      console.log('getUserNameApi', result);
      if (isErrorResponse(result)) {
        handleErrorResponse(result);
      } else if ('success' in result) {
        await storeData(Constant.USER_NAME, result.success.username);
        getLights(ip, result.success.username);
      } else {
        showWentWrong();
      }
    } catch (error) {
      showWentWrong();
      console.log('getUserNameApi_error', error);
    }
  };

  const getLights = async (ip: any, user: string) => {
    try {
      const result = await getLightsApi(ip, user);
      console.log('getLights_result_2', result);
      if (isErrorResponse(result)) {
        handleErrorResponse(result);
      } else {
        const filteredKeys = Object.keys(result);
        await storeData(Constant.LIGHT_NAME, filteredKeys.length + '');
        const db = database();
        const userRef = db.ref('/light/' + user);
        userRef.set(result);
        const userCountRef = db.ref('/light/' + user + '/count');
        userCountRef.set(filteredKeys);
        store.dispatch(setLightList(result));
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

  const isErrorResponse = (result: any): boolean => {
    return Array.isArray(result) && result.length > 0 && 'error' in result[0];
  };

  const reDirectToAuthenticate = () => {
    navigation.replace('PHPushLink');
  };

  const onOffLights = async () => {
    console.log('onOffLights');
    try {
      stopRainbowLightHandler();
      setOnLight(!onLight);
      const result = onOffLight(onLight);
      console.log('onOffLights', result);
    } catch (error) {
      showWentWrong();
      console.log('onOffLights_error', error);
    }
  };

  const changeLightBrightness = async (brightness: number) => {
    try {
      const adapted = (254 * brightness) / 100;
      console.log('adapted', adapted);
      const result = adjustLightBrightness(adapted);
      console.log('changeLightBrightness', result);
    } catch (error) {
      showWentWrong();
      console.log('changeLightBrightness_error', error);
    }
  };

  const changeHueLightColor = async (r: number, g: number, b: number) => {
    const xy = toXY(r, g, b);
    console.log('color', xy);
    console.log('lightList.length', lightList.length);
    try {
      const result = changeLightColor(xy);
      console.log('changeLightBrightness', result);
    } catch (error) {
      showWentWrong();
      console.log('changeHueLightColor_error', error);
    }
  };

  const startRainbowLightHandler = () => {
    dispatch(setIsIntervalRunning(true));
  };

  const stopRainbowLightHandler = () => {
    dispatch(setIsIntervalRunning(false));
  };

  return (
    <View style={styles.parentContainer}>
      <View>
        <Text style={styles.titleStyle}>
          Click the Random Lights Button to set your lamps to random colours.
        </Text>
        <TouchableOpacity
          style={styles.rainboxContainer}
          onPress={startRainbowLightHandler}>
          <View style={styles.container}>
            <Image source={assets.Rainbow} style={styles.imageStyle} />
            <Text style={styles.textStyle}>Random Lights</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.titleStyle}
          onPress={stopRainbowLightHandler}>
          <View style={styles.container}>
            <Text style={styles.textStyle}>Stop Rainbow Lights</Text>
          </View>
        </TouchableOpacity>
        <Text style={styles.titleStyle}>Switch ON/Off the light</Text>
        <TouchableOpacity style={styles.rainboxContainer} onPress={onOffLights}>
          <View style={styles.container}>
            <Text style={styles.textStyle}>ON / OFF</Text>
          </View>
        </TouchableOpacity>
        <Text style={styles.titleStyle}>Change Brightness</Text>
        <View style={styles.subContainer}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => changeLightBrightness(20)}>
            <Text style={styles.textStyle}>20%</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.button}
            onPress={() => changeLightBrightness(40)}>
            <Text style={styles.textStyle}>40%</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.button}
            onPress={() => changeLightBrightness(60)}>
            <Text style={styles.textStyle}>60%</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.button}
            onPress={() => changeLightBrightness(80)}>
            <Text style={styles.textStyle}>80%</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.button}
            onPress={() => changeLightBrightness(100)}>
            <Text style={styles.textStyle}>100%</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.titleStyle}>Change Color</Text>
        <View style={styles.subContainer}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => {
              stopRainbowLightHandler();
              changeHueLightColor(0, 100, 66);
            }}>
            <Text style={styles.textStyle}>Green</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.button}
            onPress={() => {
              stopRainbowLightHandler();
              changeHueLightColor(255, 155, 189);
            }}>
            <Text style={styles.textStyle}>Pink</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.button}
            onPress={() => {
              stopRainbowLightHandler();
              changeHueLightColor(73, 151, 208);
            }}>
            <Text style={styles.textStyle}>Blue</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.button}
            onPress={() => {
              stopRainbowLightHandler();
              changeHueLightColor(240, 240, 240);
            }}>
            <Text style={styles.textStyle}>White</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

export default PHLights;

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
    fontSize: 15,
    textAlign: 'center',
    alignItems: 'center',
    alignContent: 'center'
  },
  subContainer: { flexDirection: 'row', alignSelf: 'center' },
  titleStyle: {
    alignSelf: 'center',
    color: 'black',
    marginBottom: 10,
    marginTop: 20,
    fontSize: 15,
    textAlign: 'center',
    marginHorizontal: 10
  },
  imageStyle: {},
  container: {
    alignContent: 'center',
    flexDirection: 'row',
    backgroundColor: '#F1F1F1',
    paddingEnd: 10,
    alignItems: 'center',
    alignSelf: 'center'
  },
  button: {
    backgroundColor: '#F1F1F1',
    paddingHorizontal: 10,
    marginStart: 10
  },
  parentContainer: {
    backgroundColor: 'white',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  rainboxContainer: {
    alignContent: 'center',
    alignSelf: 'center'
  }
});
