// state - rootReducer
import { combineReducers } from 'redux';
import lightList from './Lights';
import lightControls from './LightControls';

const rootReducer = combineReducers({ lightList, lightControls });

export type RootState = ReturnType<typeof rootReducer>;
export default rootReducer;
