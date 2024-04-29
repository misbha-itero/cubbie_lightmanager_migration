import rootReducer from './rootReducer';
import { configureStore } from '@reduxjs/toolkit';
import { useDispatch } from 'react-redux';

const store = configureStore({
  reducer: rootReducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

/* Infer the `RootState` and `AppDispatch` types from the store itself */
export type RootState = ReturnType<typeof store.getState>;

export type AppDispatch = typeof store.dispatch;
/* Export a hook that can be reused to resolve types */
export const useAppDispatch = () => useDispatch<AppDispatch>();

export default store;
