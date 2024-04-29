import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface LightDetails {
  state: Light;
  name: string;
  productname: string;
  modelid: string;
  productid: string;
  uniqueid: string;
  swversion: string;
  swconfigid: string;
}

export interface Light {
  on: boolean;
  bri: number;
  hue: number;
  sat: number;
  xy: [number];

}

interface LightState {
  lightList: LightDetails[];
}

const initialState: LightState = {
  lightList: []
};

const lightListSlice = createSlice({
  name: 'lightList',
  initialState: initialState,
  reducers: {
    resetState: () => initialState,
    setAppointments: (state, { payload }: PayloadAction<LightDetails[]>) => {
      state.lightList = payload;
    }
  }
});

export const { resetState, setAppointments: setLightList } =
  lightListSlice.actions;
export default lightListSlice.reducer;
