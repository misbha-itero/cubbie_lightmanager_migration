import { PayloadAction, createSlice } from '@reduxjs/toolkit';

interface ConfigData {
  name: string;
  datastoreversion: string;
  swversion: string;
  apiversion: string;
  mac: string;
  bridgeid: string;
  modelid: string;
}

interface ConfigState {
  configData: ConfigData[];
}

const initialState: ConfigState = {
  configData: []
};

const configSlice = createSlice({
  name: 'configData',
  initialState,
  reducers: {
    resetState: () => initialState,
    setConfigData: (state, { payload }: PayloadAction<ConfigData>) => {
      state.configData = [payload];
    }
  }
});

export const { resetState, setConfigData: setConfigData } = configSlice.actions;
export default configSlice.reducer;
