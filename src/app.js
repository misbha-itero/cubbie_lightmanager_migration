// App
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import TcpSocket from 'react-native-tcp-socket';
import * as ScopedStorage from 'react-native-scoped-storage';
import { Alert, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import RNFS from 'react-native-fs';

import PHHomeScreen from './screens/PHHome';
import PHPushLinkScreen from './screens/PHPushlink';
import PHLights from './screens/PHLights';
import {
  executeCommand,
  startBackgroundService
} from './services/LightService';
import store from './state';
import {
  setClient,
  setDefaultBrightness,
  setDefaultDuration
} from './state/LightControls';
import { getStoredData, storeData } from './storage/LocalStorage';
import { Modal } from './components';
import ApiUtil from './utils/ApiUtil';

const Stack = createStackNavigator();

const clientType = 'lightManager';

export const createConnection = async () => {
  const client = await TcpSocket.createConnection(
    { port: 3000, host: 'localhost' },
    () => {
      console.log('Connected to server');

      // Send a message to the server
      // client.write('Hello from client');
      const registrationMessage = JSON.stringify({
        type: 'register',
        clientType
      });
      client.write(registrationMessage);
      store.dispatch(setClient(client));
      client.on('data', async data => {
        const message = data.toString('utf8');
        console.log('Received:', message);
        const parsedMessage = JSON.parse(message);
        if (parsedMessage.type === 'light') {
          executeCommand(parsedMessage);
        } else {
          const parsedCommand = JSON.parse(parsedMessage.command);
          if (parsedCommand.action === 'stop_playlist') {
            executeCommand(parsedMessage);
          }
        }
      });

      client.on('error', error => {
        console.log('Connection error:', error);
      });

      client.on('ready', error => {
        console.log('Connection Ready!');
      });

      client.on('close', error => {
        console.log('Connection Closed!');
        store.dispatch(setClient(null));
      });

      client?.on('end', error => {
        console.log('Connection ended!');
        store.dispatch(setClient(null));
      });
    }
  );
};

export const sendMessage = message => {
  const { client } = store.getState().lightControls;

  if (client) {
    client.write(message);
  } else {
    console.log('Client not available');
  }
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5
  },
  modalButton: {
    borderRadius: 10,
    padding: 10,
    elevation: 2
  },
  buttonClose: {
    backgroundColor: '#2196F3'
  },
  textStyle: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center'
  },
  modalText: {
    color: 'black',
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 15,
    fontSize: 16
  },
  pathText: {
    color: '#2196F3',
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 15,
    fontSize: 16
  },
  modal: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000'
  },
  popupText: {
    fontSize: 20,
    color: 'white'
  }
});

function App() {
  const { client, defaultBrightness, defaultDuration } = useSelector(
    state => state.lightControls
  );
  const dispatch = useDispatch();
  const [isExpired, setIsExpired] = useState(false);

  const checkExpiration = async () => {
    const expirationDateTime = new Date('2024-04-30T12:00:00+05:30'); // Set expiration date and time (Mar 26 12 PM IST)
    const response = await ApiUtil.getWithoutToken(
      'http://ec2-3-249-38-68.eu-west-1.compute.amazonaws.com:7000/mediaBox/currentDateTime'
    );
    console.log('response', response);
    const { currentDateTime } = response;
    const current = new Date(currentDateTime);
    console.log(current, expirationDateTime);

    if (current >= expirationDateTime) {
      console.log('Time expired');
      setIsExpired(true);
      client?.end();
    } else {
      console.log('Time not expired');
      setIsExpired(false);
    }
  };

  useEffect(() => {
    checkExpiration(); // Initial check on component mount

    let timeout = setTimeout(function checkExpiry() {
      checkExpiration(); // Check expiration periodically
      timeout = setTimeout(checkExpiry, 60000); // Recursive call after 1 minute
    }, 60000);

    // Clean up
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!isExpired) {
      createConnection();
      startBackgroundService();

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
      }, 5000);

      return () => {
        // client.end();
        // stopBackgroundService();
      };
    }
  }, []);

  const [isShowModal, setIsShowModal] = useState({
    isVisible: false,
    content: '',
    isPermissionGranted: false
  });

  const getContentPath = contentUri => {
    const decodedUri = decodeURIComponent(contentUri);
    const uriParts = decodedUri.split('/primary:');

    return uriParts.length > 0 ? uriParts.pop() : '';
  };

  const getConfigPermission = async key => {
    try {
      if (key) {
        console.log('getConfigPermission', key);
        const selectedDirectory = await ScopedStorage.openDocumentTree(true);
        const selectedPath = getContentPath(selectedDirectory.uri);

        if (selectedPath !== 'Download/Cubbie') {
          return Alert.alert(
            'Choose the correct path',
            `The selected path "${selectedPath}" is incorrect. \n\n Please Select \n"Internal Storage/Download/Cubbie"`,
            [
              { text: 'Cancel' },
              {
                text: 'Choose the path',
                onPress: () => {
                  getPermission(key);
                }
              }
            ]
          );
        }

        if (selectedDirectory) {
          const cubbieFolderPath =
            'content://com.android.externalstorage.documents/tree/primary%3ADownload%2FCubbie/document/primary%3ADownload%2FCubbie';
          const persistedUris =
            await ScopedStorage.getPersistedUriPermissions();
          let isExpectedDirectory = false;

          if (cubbieFolderPath === selectedDirectory.uri) {
            isExpectedDirectory = true;
            await storeData(key, JSON.stringify(selectedDirectory));
          }

          if (isExpectedDirectory) {
            setIsShowModal({
              isVisible: false,
              content: '',
              isPermissionGranted: true
            });
            return selectedDirectory;
          }

          await ScopedStorage.releasePersistableUriPermission(
            persistedUris[persistedUris.length - 1]
          );
          setIsShowModal({
            isVisible: true,
            content: 'Download/Cubbie',
            isPermissionGranted: false
          });
        }
      }
    } catch (error) {
      console.log('error', error);
    }
  };

  const getPermission = async () => {
    try {
      const hasConfigPathAccess = await getStoredData('config');
      if (!hasConfigPathAccess) {
        if (!isShowModal.isVisible && !isShowModal.content) {
          setIsShowModal({
            isVisible: true,
            content: 'Download/Cubbie',
            isPermissionGranted: false
          });
        }

        if (!isShowModal.isVisible && isShowModal.content) {
          await getConfigPermission('config');
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  const getConfigFile = async () => {
    try {
      const filePath =
        'content://com.android.externalstorage.documents/tree/primary%3ADownload%2FCubbie/document/primary%3ADownload%2FCubbie%2Fconfig.json';
      const file = await RNFS.readFile(filePath);
      return file;
    } catch (err) {
      console.log('Error Occurs when getting the config file', err);
    }
  };

  const downloadConfig = async () => {
    const hasConfigPathAccess = await getStoredData('config');

    if (hasConfigPathAccess) {
      const configFile = await getConfigFile();
      const parsedConfigData = configFile ? JSON.parse(configFile) : null;
      const { light } = parsedConfigData?.preferences;

      if (light) {
        dispatch(setDefaultBrightness(light.default_brightness));
        dispatch(setDefaultDuration(light.default_duration));
      }
    }
  };

  useEffect(() => {
    if (!isExpired) {
      getPermission();
      downloadConfig();
    }
  }, [isShowModal]);

  if (isExpired) {
    return (
      <View style={[styles.modal, { opacity: isExpired ? 1 : 0 }]}>
        <Text style={styles.popupText}>The app license has been expired</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Modal isVisible={isShowModal.isVisible}>
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalText}>
              Please Select{' '}
              <Text style={styles.pathText}>{isShowModal.content}</Text> path
            </Text>
            <TouchableOpacity
              style={[styles.modalButton, styles.buttonClose]}
              onPress={() => {
                console.log('onpress');
                setIsShowModal({
                  ...isShowModal,
                  isVisible: false,
                  isPermissionGranted: false
                });
              }}>
              <Text style={styles.textStyle}>Ok</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: '#0277bd' },
          headerTintColor: 'white',
          headerTitleStyle: { fontWeight: 'bold' }
        }}
        initialRouteName="Home">
        <Stack.Screen name="Home" component={PHHomeScreen} />
        <Stack.Screen name="PHPushLink" component={PHPushLinkScreen} />
        <Stack.Screen name="PHLights" component={PHLights} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;
