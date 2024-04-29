/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App, { createConnection } from './src/app';
import { name as appName } from './app.json';
import { Provider } from 'react-redux';
import store from './src/state';
import firebase from '@react-native-firebase/app';
import { startBackgroundService } from './src/services/LightService';

const Root = () => {
  return (
    <Provider store={store}>
      <App />
    </Provider>
  );
};

const firebaseConfig = {
  apiKey: 'AIzaSyAjWEgW-QGr09l1s2RlOczi3kRS_hfmQes',
  projectId: 'com.cubbie_lightmanager_migration',
  messagingSenderId: '124907196496',
  appId: '1:124907196496:android:572ddb65894bd0e4dac155',
  authDomain: 'hreact-native-light-manager-app.firebaseapp.com',
  databaseURL:
    'https://react-native-light-manager-app-default-rtdb.firebaseio.com/',
  storageBucket: 'react-native-light-manager-app.appspot.com'
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

let intervalId;
const BackgroundTask = async () => {
  console.log(
    'Receiving Background Event!---------------------------------------------------'
  );
  await createConnection();
  await startBackgroundService();

  const intervalId = setInterval(() => {
    try {
      const newClient = store.getState().lightControls.client;
      if (
        !newClient?.localAddress ||
        Object.keys(newClient?.address()).length === 0 ||
        !newClient?.localPort
      ) {
        console.log(
          newClient?.localAddress,
          newClient?.localAddress,
          newClient?.address()
        );
        createConnection();
      }
    } catch (err) {
      createConnection();
    }
  }, 10000);
  console.log(
    'Processed Background Event!---------------------------------------------------'
  );
};

AppRegistry.registerHeadlessTask('Background', () => BackgroundTask);
AppRegistry.registerComponent(appName, () => Root);
