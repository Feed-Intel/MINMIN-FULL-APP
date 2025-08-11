import React from "react";
import { Dimensions, Platform, StyleSheet, View } from "react-native";
import { useTheme } from "react-native-paper";

const { width, height } = Dimensions.get("window");

const innerDimension = 300;

export const Overlay = () => {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      {/* Outer overlay */}
      <View
        style={[styles.overlay, { backgroundColor: "rgba(0, 0, 0, 0.5)" }]}
      />

      {/* Inner transparent cutout */}
      <View
        style={[
          styles.innerCutout,
          {
            width: innerDimension,
            height: innerDimension,
            borderRadius: 50,
            top: height / 2 - innerDimension / 2,
            left: width / 2 - innerDimension / 2,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  innerCutout: {
    position: "absolute",
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "white", // Optional: Add a border to highlight the cutout
  },
});
