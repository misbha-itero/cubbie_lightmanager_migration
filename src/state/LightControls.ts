import { PayloadAction, createSlice } from '@reduxjs/toolkit';

type PlayList = { brightness: number; color: string };

type LightState = {
  on: boolean | null;
  brightness: number | null;
  hue: number | null;
  saturation: number | null;
  xy: number[] | null;
  ct: number | null;
  alert: string | null;
  effect: string | null;
  message: string | null;
};

interface InitalStateType {
  playList: PlayList[] | null;
  lightColor: string | null;
  currentLight: any | null;
  currentBrightness: number | null;
  lightStartTime: number | null;
  lightState: LightState | null;
  isBrightnessChanged: boolean;
  timeoutRefId: any | null;
  randomLightsRunnable: any;
  randomLightsPosition: any;
  startRandomLights: boolean;
  remainingPausedLightTime: any;
  defaultBrightness: number;
  defaultDuration: number;
  client: any;
  isIntervalRunning: any
}

export const initalLightState = {
  on: null,
  brightness: null,
  hue: null,
  saturation: null,
  xy: null,
  ct: null,
  alert: null,
  effect: null,
  message: null
};

const initialState: InitalStateType = {
  playList: null,
  lightColor: null,
  currentLight: null,
  currentBrightness: null,
  lightStartTime: null,
  lightState: null,
  timeoutRefId: null,
  isBrightnessChanged: false,
  randomLightsRunnable: null,
  randomLightsPosition: null,
  startRandomLights: false,
  remainingPausedLightTime: null,
  defaultBrightness: 0,
  defaultDuration: 0,
  client: null,
  isIntervalRunning: false
};

const lightControlSlice = createSlice({
  name: 'lightControl',
  initialState,
  reducers: {
    resetState: () => initialState,
    setPlayList: (state, { payload }: PayloadAction<PlayList[]>) => {
      state.playList = payload;
    },
    setLightColor: (state, { payload }: PayloadAction<string>) => {
      state.lightColor = payload;
    },
    setCurrentLight: (state, { payload }: PayloadAction<string>) => {
      state.currentLight = payload;
    },
    setCurrentBrightness: (state, { payload }: PayloadAction<number>) => {
      state.currentBrightness = payload;
    },
    setLightState: (state, { payload }: PayloadAction<LightState>) => {
      state.lightState = payload;
    },
    setTimeoutRefId: (state, { payload }: PayloadAction<any>) => {
      state.timeoutRefId = payload;
    },
    setIsBrightnessChanged: (state, { payload }: PayloadAction<any>) => {
      state.isBrightnessChanged = payload;
    },
    setRandomLightsRunnable: (state, { payload }: PayloadAction<any>) => {
      state.randomLightsRunnable = payload;
    },
    setRandomLightsPosition: (state, { payload }: PayloadAction<any>) => {
      state.randomLightsPosition = payload;
    },
    setStartRandomLights: (state, { payload }: PayloadAction<boolean>) => {
      state.startRandomLights = payload;
    },
    setLightStartTime: (state, { payload }: PayloadAction<any>) => {
      state.lightStartTime = payload;
    },
    setRemainingLightTime: (state, { payload }: PayloadAction<any>) => {
      state.remainingPausedLightTime = payload;
    },
    setDefaultBrightness: (state, { payload }: PayloadAction<any>) => {
      state.defaultBrightness = payload;
    },
    setDefaultDuration: (state, { payload }: PayloadAction<any>) => {
      state.defaultDuration = payload;
    },
    setClient: (state, { payload }: PayloadAction<any>) => {
      state.client = payload;
    },
    setIsIntervalRunning: (state, { payload }: PayloadAction<any>) => {
      state.isIntervalRunning = payload;
    }
  }
});

export const {
  resetState,
  setPlayList,
  setCurrentLight,
  setCurrentBrightness,
  setLightColor,
  setLightState,
  setTimeoutRefId,
  setIsBrightnessChanged,
  setRandomLightsRunnable,
  setRandomLightsPosition,
  setStartRandomLights,
  setLightStartTime,
  setRemainingLightTime,
  setDefaultBrightness,
  setDefaultDuration,
  setClient,
  setIsIntervalRunning
} = lightControlSlice.actions;

export default lightControlSlice.reducer;
