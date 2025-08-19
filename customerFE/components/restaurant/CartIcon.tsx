import React from "react";
import { Button, Surface, Text, Badge } from "react-native-paper";
import { router } from "expo-router";

export default function CartIcon() {
  return (
    <Surface
      style={{
        position: "absolute",
        bottom: 20,
        width: "90%",
        alignSelf: "center",
        elevation: 4,
        borderRadius: 25,
      }}
    >
      <Button
        mode="contained"
        onPress={() => router.push("/(cart)" as any)}
        contentStyle={{
          flexDirection: "row",
          justifyContent: "space-between",
          paddingVertical: 10,
        }}
        labelStyle={{
          color: "white",
          fontWeight: "bold",
          fontSize: 16,
        }}
        style={{
          backgroundColor: "black",
          borderRadius: 25,
        }}
      >
        <Badge
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.4)",
            color: "white",
            fontWeight: "bold",
            fontSize: 16,
            marginRight: 10,
          }}
        >
          3
        </Badge>
        <Text style={{ flex: 1, textAlign: "center", color: "white" }}>
          Box Cart
        </Text>
        <Text style={{ color: "white", fontWeight: "bold" }}>$23</Text>
      </Button>
    </Surface>
  );
}
