import { PayloadAction, createSlice } from '@reduxjs/toolkit';

interface IPData {
  id: string;
  internalipaddress: string;
  port: number;
}

interface IpState {
  ipData: IPData[];
}

const initialState: IpState = {
  ipData: []
};

const ipSlice = createSlice({
  name: 'ipData',
  initialState,
  reducers: {
    resetState: () => initialState,
    setSlice: (state, { payload }: PayloadAction<IPData>) => {
      state.ipData = [payload];
    }
  }
});

export const { resetState, setSlice: setSlice } = ipSlice.actions;
export default ipSlice.reducer;
