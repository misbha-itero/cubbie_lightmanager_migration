export function toXY(r, g, b) {
  // 1. Get the RGB values from your color object and convert them to be between 0 and 1.
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;

  // 2. Apply a gamma correction to the RGB values.
  const correctedRed = getWithGammaCorrection(red);
  const correctedGreen = getWithGammaCorrection(green);
  const correctedBlue = getWithGammaCorrection(blue);

  // 3. Convert the RGB values to XYZ using the Wide RGB D65 conversion formula.
  const X =
    correctedRed * 0.664511 +
    correctedGreen * 0.154324 +
    correctedBlue * 0.162028;
  const Y =
    correctedRed * 0.283881 +
    correctedGreen * 0.668433 +
    correctedBlue * 0.047685;
  const Z =
    correctedRed * 0.000088 +
    correctedGreen * 0.07231 +
    correctedBlue * 0.986039;

  // 4. Calculate the xy values from the XYZ values.
  const x = X / (X + Y + Z);
  const y = Y / (X + Y + Z);

  return [x, y];
}

export function getWithGammaCorrection(value) {
  if (value <= 0.04045) {
    return value / 12.92;
  } else {
    return Math.pow((value + 0.055) / 1.055, 2.4);
  }
}
