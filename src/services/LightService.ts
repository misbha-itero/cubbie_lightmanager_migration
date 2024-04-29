import { sendMessage } from '../app';
import { Constant } from '../constants/Strings';
import store from '../state';
import {
  initalLightState,
  setCurrentBrightness,
  setCurrentLight,
  setDefaultBrightness,
  setDefaultDuration,
  setIsBrightnessChanged,
  setIsIntervalRunning,
  setLightStartTime,
  setLightState,
  setPlayList,
  setRandomLightsPosition,
  setRandomLightsRunnable,
  setRemainingLightTime,
  setStartRandomLights,
  setTimeoutRefId
} from '../state/LightControls';
import { resetState } from '../state/Lights';
import { getStoredData } from '../storage/LocalStorage';
import ApiUtil from '../utils/ApiUtil';
import BackgroundService from 'react-native-background-actions';
import { toXY } from '../utils/ColorUtil';
import Background from '../Background';
import database from '@react-native-firebase/database';

const sleep = (time: any) =>
  new Promise(resolve => setTimeout(() => resolve(null), time));

const veryIntensiveTask = async (taskDataArguments: any) => {
  // Example of an infinite loop task
  const { delay, message } = taskDataArguments;

  await new Promise(async resolve => {
    for (let i = 0; BackgroundService.isRunning(); i++) {
      await sleep(delay);
    }
  });
};

const options = {
  taskName: 'Server',
  taskTitle: 'Cubbie light manger is running',
  taskDesc: '',
  taskIcon: {
    name: 'ic_launcher',
    type: 'drawable'
  },
  color: '#ff00ff',
  linkingURI: 'yourSchemeHere://chat/jane', // See Deep Linking for more info
  parameters: {
    delay: 60000,
    message: 'message'
  }
};

export const startBackgroundService = async () => {
  if (!BackgroundService.isRunning()) {
    await BackgroundService.start(veryIntensiveTask, options);
  }

  const isBackgroundServiceRunning = await Background.isServiceRunning();

  if (!isBackgroundServiceRunning) {
    await Background.startService();
  }
};

export const stopBackgroundService = async () => {
  try {
    await Background.stopService();
    // await BackgroundService.stop();
  } catch (error) {
    console.log('error', error);
  }
};

export interface IpResponse {
  id: string;
  internalipaddress: string;
  port: number;
}

export interface ConfigResponse {
  name: string;
  datastoreversion: string;
  swversion: string;
  apiversion: string;
  mac: string;
  bridgeid: string;
  factorynew: boolean;
  replacesbridgeid: string;
  modelid: string;
  starterkitid: string;
}

export interface UsserNameErrorResponse {
  type: number;
  address: string;
  description: string;
}

export interface UsserNameSuccessResponse {
  username: string;
}

export const findLightIp = async () => {
  try {
    const response = await ApiUtil.getWithoutToken(
      'https://discovery.meethue.com/'
    );
    console.log('response', response);
    if (response) {
      return response;
    }
    return null;
  } catch (err) {
    console.log(err);
    throw err;
  }
};

export const getConfig = async (ipAddress: string) => {
  try {
    const response = await ApiUtil.getWithoutToken(
      'http://' + ipAddress + '/api/0/config'
    );
    if (response) {
      return response;
    }
    return null;
  } catch (err) {
    console.log(err);
    throw err;
  }
};

export const getUserName = async (ipAddress: string, devicetype: string) => {
  try {
    const response = await ApiUtil.postWithoutToken(
      'http://' + ipAddress + '/api/',
      { devicetype: devicetype }
    );
    if (response) {
      return response;
    }
    return null;
  } catch (err) {
    console.log(err);
    throw err;
  }
};

export const getLightsApi = async (ipAddress: string, userName: string) => {
  try {
    const response = await ApiUtil.getWithoutToken(
      'http://' + ipAddress + '/api/' + userName + '/lights'
    );
    if (response) {
      return response;
    }
    return null;
  } catch (err) {
    console.log(err);
    throw err;
  }
};

export const onOffLight = async (isOnState: boolean) => {
  try {
    const lightsCount = Number(await getStoredData(Constant.LIGHT_NAME));
    const ipAddress = await getStoredData(Constant.IP_ADDRESS);
    const userName = await getStoredData(Constant.USER_NAME);
    console.log('light-name', lightsCount);
    if (lightsCount > 0) {
      for (let i = 1; i <= lightsCount; i++) {
        const response = await ApiUtil.putWithoutToken(
          'http://' +
          ipAddress +
          '/api/' +
          userName +
          '/lights/' +
          i +
          '/state',
          { on: isOnState }
        );
        console.log('light-response', response);
      }
    }
  } catch (err) {
    console.log(err);
    throw err;
  }
};

export const adjustLightBrightness = async (brightness: number) => {
  try {
    const lightsCount = Number(await getStoredData(Constant.LIGHT_NAME));
    const ipAddress = await getStoredData(Constant.IP_ADDRESS);
    const userName = await getStoredData(Constant.USER_NAME);
    const roundedNumber = Math.floor(brightness);
    if (lightsCount > 0) {
      for (let i = 1; i <= lightsCount; i++) {
        const response = await ApiUtil.putWithoutToken(
          'http://' +
          ipAddress +
          '/api/' +
          userName +
          '/lights/' +
          i +
          '/state',
          { bri: roundedNumber, on: true }
        );
        console.log('light-response', response);
      }
    }
  } catch (err) {
    console.log(err);
    throw err;
  }
};

export const changeLightColor = async (color: number[]) => {
  try {
    try {
      const db = database();
      const user = getStoredData(Constant.USER_NAME);
      const userRef = db.ref(`/light/changeLightColor/${user}/start`);
      userRef.set({ status: 'Change light color started' });
    } catch (err) {
      // Left empty
    }

    const lightsCount = Number(await getStoredData(Constant.LIGHT_NAME));
    const ipAddress = await getStoredData(Constant.IP_ADDRESS);
    const userName = await getStoredData(Constant.USER_NAME);

    try {
      const db = database();
      const user = getStoredData(Constant.USER_NAME);
      const userRef = db.ref(`/light/changeLightColor/${user}/middle`);
      userRef.set({ status: 'Change light color middle', lightsCount });
    } catch (err) {
      // Left empty
    }
    if (lightsCount > 0) {
      for (let i = 1; i <= lightsCount; i++) {
        const response = await ApiUtil.putWithoutToken(
          'http://' +
          ipAddress +
          '/api/' +
          userName +
          '/lights/' +
          i +
          '/state',
          {
            xy: color,
            on: true
          }
        );
        console.log('light-response', response);
        try {
          const db = database();
          const user = getStoredData(Constant.USER_NAME);
          const userRef = db.ref(`/light/changeLightColor/${user}/end/${i}`);
          userRef.set({ response, status: 'Updated the light' });
        } catch (err) {
          // Left empty
        }
      }
    }
  } catch (err) {
    console.log(err);
    throw err;
  }
};

export const changeLightColorWithBrightness = async (
  color: number[],
  brightness: number
) => {
  try {
    const lightsCount = Number(await getStoredData(Constant.LIGHT_NAME));
    const ipAddress = await getStoredData(Constant.IP_ADDRESS);
    const userName = await getStoredData(Constant.USER_NAME);
    const roundedNumber = Math.floor(brightness);
    if (lightsCount > 0) {
      for (let i = 1; i <= lightsCount; i++) {
        const response = await ApiUtil.putWithoutToken(
          'http://' +
          ipAddress +
          '/api/' +
          userName +
          '/lights/' +
          i +
          '/state',
          {
            xy: color,
            on: true,
            bri: roundedNumber
          }
        );
        console.log('light-response', response);
      }
    }
  } catch (err) {
    console.log(err);
    throw err;
  }
};

const getColor = (r: number, g: number, b: number) => {
  const hueColor = {
    r: 0,
    g: 0,
    b: 0
  };
  hueColor.r = r;
  hueColor.g = g;
  hueColor.b = b;
  return hueColor;
};

const getColorsArray = () => {
  const hueColors = [];
  hueColors.push(getColor(255, 0, 0));
  hueColors.push(getColor(255, 255, 0));
  hueColors.push(getColor(255, 192, 203));
  hueColors.push(getColor(0, 128, 0));
  hueColors.push(getColor(255, 165, 0));
  hueColors.push(getColor(0, 0, 255));
  return hueColors;
};

const colorConverterToXY = (r: number, g: number, b: number) => {
  // 1. Normalize RGB values to be between 0 and 1
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;

  // 2. Apply gamma correction
  const gammaCorrectedRed = getWithGammaCorrection(red);
  const gammaCorrectedGreen = getWithGammaCorrection(green);
  const gammaCorrectedBlue = getWithGammaCorrection(blue);

  // 3. Convert RGB to XYZ
  const X =
    gammaCorrectedRed * 0.664511 +
    gammaCorrectedGreen * 0.154324 +
    gammaCorrectedBlue * 0.162028;
  const Y =
    gammaCorrectedRed * 0.283881 +
    gammaCorrectedGreen * 0.668433 +
    gammaCorrectedBlue * 0.047685;
  const Z =
    gammaCorrectedRed * 0.000088 +
    gammaCorrectedGreen * 0.07231 +
    gammaCorrectedBlue * 0.986039;

  // 4. Calculate xy values from XYZ values
  const x = X / (X + Y + Z);
  const y = Y / (X + Y + Z);

  return [x, y];
};

// Function to convert color to XY
function colorToXY(color: number) {
  const red = (color >> 16) & 255;
  const green = (color >> 8) & 255;
  const blue = color & 255;

  return colorConverterToXY(red, green, blue);
}

// Function for gamma correction
const getWithGammaCorrection = (value: number) => {
  return value > 0.04045
    ? Math.pow((value + 0.055) / (1.0 + 0.055), 2.4)
    : value / 12.92;
};

const randomColorXy = () => {
  const { randomLightsPosition } = store.getState().lightControls;
  const colors = getColorsArray();
  if (randomLightsPosition < colors.length) {
    return colorConverterToXY(
      colors[randomLightsPosition].r,
      colors[randomLightsPosition].g,
      colors[randomLightsPosition].b
    );
  }
  return colorConverterToXY(0, 100, 66);
};

const updateRandomLightColorApi = async (
  randomColor: number[],
  brightness: number
) => {
  const { lightState } = store.getState().lightControls;
  let newLightState = lightState;
  if (newLightState === null) {
    newLightState = initalLightState;
  }
  newLightState.on = true;
  newLightState.brightness = brightness;
  newLightState.xy = [...randomColor];
  store.dispatch(setLightState(newLightState));
  await changeLightColorWithBrightness(
    newLightState.xy,
    newLightState.brightness
  );
};

const stopRandomLightHandler = () => {
  const { randomLightsRunnable } = store.getState().lightControls;

  if (randomLightsRunnable != null) {
    clearTimeout(randomLightsRunnable);
    store.dispatch(setRandomLightsRunnable(null));
  }

  if (interval) {
    clearInterval(interval)
  }
};

const playNextRandomLight = async () => {
  const { randomLightsPosition, currentBrightness } =
    store.getState().lightControls;
  const adapted = (254 * currentBrightness) / 100;

  let newRandomLightPosition = randomLightsPosition;
  newRandomLightPosition += 1;
  if (newRandomLightPosition >= getColorsArray().length) {
    newRandomLightPosition = 0;
  }
  store.dispatch(setRandomLightsPosition(newRandomLightPosition));
  store.dispatch(setRandomLightsRunnable(null));
  await updateRandomLightColorApi(randomColorXy(), adapted);
  startRandomLightHandler();
};

let interval: any;
const startRandomLightHandler = () => {
  console.log('startRandomLightHandler');
  try {
    let { startRandomLights } = store.getState().lightControls;
    if (startRandomLights) {
      var progress = 1;
      changeLightColor(toXY(0, 0, 255));
      interval = setInterval(() => {
        let { startRandomLights } = store.getState().lightControls;
        if (startRandomLights) {
          console.log('progress', progress);
          if (progress === 1) {
            progress = 2;
            changeLightColor(toXY(255, 0, 0));
          } else if (progress === 2) {
            progress = 3;
            changeLightColor(toXY(255, 255, 0));
          } else if (progress === 3) {
            progress = 4;
            changeLightColor(toXY(255, 192, 203));
          } else if (progress === 4) {
            progress = 5;
            changeLightColor(toXY(0, 128, 0));
          } else if (progress === 5) {
            progress = 6;
            changeLightColor(toXY(255, 165, 0));
          } else if (progress === 6) {
            progress = 1;
            changeLightColor(toXY(0, 0, 255));
          }
        }
      }, 7000); // 1000 milliseconds = 1 second
      return () => clearInterval(interval);
    }
  } catch (error) {
    console.log('startRandomLightHandler', error);
  }
};

const playNextColor = (index: number) => {
  const { playList } = store.getState().lightControls;

  if (playList && index < playList.length - 1) {
    colorLights(playList[index + 1], false, index + 1);
  } else {
    if (playList) {
      colorLights(playList[0], false, 0);
    }
  }
};

const colorLights = async (
  media: any,
  takeControl: boolean,
  index?: number
) => {
  const { currentBrightness, lightState, playList, currentLight } =
    store.getState().lightControls;
  let newLightState = lightState;
  var colorXy;

  console.log('media', media);


  if (media?.id) {
    let color = '';
    if (newLightState == null) {
      newLightState = initalLightState;
    }

    if (media.args) {
      if (media.args?.color) {
        color = media.args?.color;
      }
    }
    const adapted = (254 * currentBrightness) / 100;
    newLightState.brightness = adapted;
    newLightState.on = true;
    if (color) {
      const colorNumber = parseInt(color.slice(1), 16); // Remove the '#' and convert to decimal
      const xy = colorToXY(colorNumber);
      colorXy = xy;
      newLightState.xy = [...xy];
    } else if (media.id > 0) {
      const r = (media.id & 0xff0000) >> 16;
      const g = (media.id & 0xff00) >> 8;
      const b = media.id & 0xff;
      console.log('colorNumber: R:' + r + ' G:' + g + ' B:' + b);
      const xy = colorConverterToXY(r, g, b);
      colorXy = xy;
      newLightState.xy = [...xy];
    } else if (media.id === -1) {
      try {
        store.dispatch(setStartRandomLights(true));
        startRandomLightHandler();
        return;
      } catch (err) {
        console.log(err);
      }
    }

    if (playList && playList?.length > 0 && colorXy && !takeControl) {
      store.dispatch(setCurrentLight({ ...media, index }));
      store.dispatch(setLightStartTime(Date.now()));
      const timeoutRefId = setTimeout(() => {
        playNextColor(index);
      }, media?.duration * 1000);
      console.log('timeoutRefId', timeoutRefId, media, media?.duration * 1000);

      store.dispatch(setLightState(newLightState));
      store.dispatch(setTimeoutRefId(timeoutRefId));
      await changeLightColor(colorXy);
      await adjustLightBrightness(newLightState.brightness);
      sendMessage(
        JSON.stringify({
          type: 'sessionData',
          category: 'light',
          light_id: media?.id,
          light_brightness: currentBrightness,
          on_state: 1
        })
      );
    }

    if (takeControl) {
      console.log('take-control', takeControl);
      if (colorXy) {
        await changeLightColorWithBrightness(colorXy, newLightState.brightness);
        console.log('change-light', colorXy + ', ' + newLightState.brightness);
        sendMessage(
          JSON.stringify({
            type: 'sessionData',
            category: 'light',
            light_id: media?.id,
            light_brightness: currentBrightness,
            on_state: 1
          })
        );
      }
    }
  }
};

const brightnessLights = async (brightness: number) => {
  const currenBrightness = Math.ceil(brightness);
  const adapted = (254 * currenBrightness) / 100;
  const { lightState } = store.getState().lightControls;

  if (lightState === null) {
    store.dispatch(setLightState(initalLightState));
  }

  if (lightState !== null) {
    const newLightState = { ...lightState };
    newLightState.on = true;
    newLightState.brightness = adapted;
    store.dispatch(setCurrentBrightness(adapted));
    store.dispatch(setLightState(newLightState));

    const ipAddress = await getStoredData(Constant.IP_ADDRESS);
    const userName = await getStoredData(Constant.USER_NAME);
    await adjustLightBrightness(newLightState.brightness);
  }
};

const startPlayList = async (command: any) => {
  const { brightness, medias } = command.args;
  const { timeoutRefId, defaultBrightness } = store.getState().lightControls;

  if (timeoutRefId) {
    clearTimeout(timeoutRefId);
    store.dispatch(setTimeoutRefId(null));
  }

  if (medias?.length > 0) {
    store.dispatch(setPlayList(medias));
    if (brightness) {
      store.dispatch(setCurrentBrightness(brightness));
    } else {
      store.dispatch(setCurrentBrightness(defaultBrightness));
    }
    colorLights(medias[0], command?.takeControl, 0);
  } else {
    if (brightness) {
      brightnessLights(brightness);
    } else {
      brightnessLights(defaultBrightness);
    }
  }
};

const startLights = async (media: any, takeControl: boolean) => {
  const { timeoutRefId, defaultBrightness } = store.getState().lightControls;
  const isBrightnessChanged = store.getState().lightControls;
  if (!isBrightnessChanged) {
    store.dispatch(setCurrentBrightness(defaultBrightness));
  }
  console.log('media', media);
  colorLights(media, takeControl);
};

const lightOff = async () => {
  try {
    const {
      lightStartTime,
      playList,
      currentLight,
      remainingPausedLightTime,
      timeoutRefId
    } = store.getState().lightControls;
    console.log('lightOff');

    const response = await onOffLight(false);

    if (playList && lightStartTime) {
      const newRemainingLightTime =
        (remainingPausedLightTime
          ? remainingPausedLightTime
          : playList[currentLight.index]?.duration * 1000) -
        (Date.now() - lightStartTime);
      store.dispatch(setRemainingLightTime(newRemainingLightTime));
      clearTimeout(timeoutRefId);
      store.dispatch(setTimeoutRefId(null));
    }
    sendMessage(
      JSON.stringify({
        type: 'sessionData',
        category: 'light',
        on_state: 0
      })
    );
  } catch (error) {
    console.log('Error occurs when turn on/off the lights:', error);
  }
};

const lightOn = async () => {
  const { currentLight, playList, remainingPausedLightTime } =
    store.getState().lightControls;
  const lightStartTime = Date.now();
  const timeoutRefId = setTimeout(
    () => playNextColor(currentLight?.index),
    remainingPausedLightTime
  );
  store.dispatch(setLightStartTime(lightStartTime));
  store.dispatch(setTimeoutRefId(timeoutRefId));
  const response = await onOffLight(true);
  sendMessage(
    JSON.stringify({
      type: 'sessionData',
      category: 'light',
      on_state: 1
    })
  );
};

const setBrightness = async (args: any) => {
  try {
    const { lightState } = store.getState().lightControls;
    const { value } = args;

    const currenBrightness = Math.ceil(value);
    const adapted = (254 * currenBrightness) / 100;

    if (lightState === null) {
      store.dispatch(setLightState(initalLightState));
    }

    if (lightState !== null) {
      const newLightState = { ...lightState };
      newLightState.on = true;
      newLightState.brightness = adapted;
      store.dispatch(setCurrentBrightness(adapted));
      const response = await adjustLightBrightness(newLightState?.brightness);

      store.dispatch(setLightState(newLightState));
    }
  } catch (err) {
    console.log(err);
  }
};

const stopPlayList = async () => {
  const { timeoutRefId, randomLightsRunnable } = store.getState().lightControls;
  if (timeoutRefId) {
    clearTimeout(timeoutRefId);
    store.dispatch(setTimeoutRefId(null));
    store.dispatch(setIsIntervalRunning(false));
  }
  stopRandomLightHandler();
  changeLightColorWithBrightness(
    [0.32272672086556803, 0.32902290955907926],
    50
  );
  console.log('stopPlaylist');

  setTimeout(lightOff, 3000);
  store.dispatch(resetState());
  store.dispatch(setStartRandomLights(false));
};

const getBrightness = () => {
  const { currentBrightness } = store.getState().lightControls;

  sendMessage(
    JSON.stringify({
      type: 'sessionData',
      category: 'light',
      light_brightness: currentBrightness
    })
  );
};

const getLightId = () => {
  const { currentLight } = store.getState().lightControls;

  sendMessage(
    JSON.stringify({
      type: 'sessionData',
      category: 'light',
      light_id: currentLight.id
    })
  );
};

const getlightState = () => {
  const { timeoutRefId } = store.getState().lightControls;

  sendMessage(
    JSON.stringify({
      type: 'sessionData',
      category: 'light',
      on_state: timeoutRefId ? 1 : 0
    })
  );
};

const emptyProgram = () => {
  const { isBrightnessChanged, defaultBrightness } =
    store.getState().lightControls;

  if (!isBrightnessChanged) {
    store.dispatch(setCurrentBrightness(defaultBrightness));
  }
};

export const executeCommand = async (command: any) => {
  try {
    const parsedCommand = JSON.parse(command.command);
    console.log('command-received', command);

    if (parsedCommand.action === 'start_playlist') {
      store.dispatch(setStartRandomLights(false));
      store.dispatch(setIsIntervalRunning(false));
      await startPlayList(parsedCommand);
    }

    if (parsedCommand.action === 'start') {
      store.dispatch(setStartRandomLights(false));
      store.dispatch(setIsIntervalRunning(false));
      await startLights(parsedCommand.args, parsedCommand.takeControl);
    }

    if (parsedCommand.action === 'stop') {
      stopPlayList();
    }

    if (parsedCommand.action === 'light_on') {
      await lightOn();
    }

    if (parsedCommand.action === 'light_off') {
      store.dispatch(setStartRandomLights(false));
      await lightOff();
    }

    if (parsedCommand.action === 'brightness') {
      store.dispatch(setIsBrightnessChanged(true));
      stopRandomLightHandler();
      setBrightness(parsedCommand.args);
    }

    if (parsedCommand.action === 'resume') {
      store.dispatch(setStartRandomLights(false));
      stopRandomLightHandler();
      lightOn();
    }

    if (parsedCommand.action === 'stop_playlist') {
      stopPlayList();
    }

    if (parsedCommand.action === 'get_brightness') {
      getBrightness();
    }

    if (parsedCommand.action === 'get_id') {
      getLightId();
    }

    if (parsedCommand.action === 'get_on_state') {
      getlightState();
    }

    if (parsedCommand.action === 'empty_program') {
      emptyProgram();
    }

    const { timeoutRefId } = store.getState()?.lightControls;
    if (parsedCommand.action === 'set_default_state' && !timeoutRefId) {
      store.dispatch(
        setDefaultDuration(parsedCommand.defaultValues.default_duration)
      );
      store.dispatch(
        setDefaultBrightness(parsedCommand.defaultValues.default_brightness)
      );
    }
  } catch (err) {
    console.log(err);
    throw err;
  }
};
