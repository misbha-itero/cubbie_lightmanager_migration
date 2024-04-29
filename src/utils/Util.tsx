import { ToastAndroid } from 'react-native';

export const showToast = (message: string) => {
  ToastAndroid.showWithGravityAndOffset(
    message,
    ToastAndroid.LONG,
    ToastAndroid.BOTTOM,
    25,
    50
  );
};

export const millisecondsToMinutes = (totalSeconds: number) => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  // Pad with leading zeros if necessary
  const formattedMinutes = minutes < 10 ? `0${minutes}` : `${minutes}`;
  const formattedSeconds = seconds < 10 ? `0${seconds}` : `${seconds}`;

  return `${formattedMinutes}:${formattedSeconds}`;
};
