
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, commonStyles } from "@/styles/commonStyles";

export default function ProfileScreen() {
  return (
    <View style={[commonStyles.container, styles.container]}>
      <Text style={commonStyles.text}>Profile (Not Used)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
