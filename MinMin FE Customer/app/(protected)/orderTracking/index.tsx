import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
// import MapView, { Marker } from "react-native-maps";
import { useNavigation } from "@react-navigation/native";
import { router } from "expo-router";

const OrderTrackingScreen: React.FC = () => {
  const navigation = useNavigation();

  // Dummy data
  const status = "Out for Delivery";
  const location = { latitude: 37.7749, longitude: -122.4194 }; // Example coordinates (San Francisco)
  const deliveryPerson = "John Doe";

  return (
    <View className="flex-1 bg-white">
      <Text className="text-2xl font-bold text-center my-3">
        Order Tracking
      </Text>

      <View className="p-5">
        <Text className="text-xl text-gray-500">Current Status:</Text>
        <Text className="text-2xl font-bold">{status}</Text>
      </View>

      {/* <MapView
        className="flex-1 my-5"
        initialRegion={{
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        <Marker
          coordinate={location}
          title="Delivery Person"
          description={deliveryPerson}
        />
      </MapView> */}

      <TouchableOpacity
        className="bg-black p-4 rounded-xl items-center my-5 mx-5"
        onPress={() => router.push("/(support)" as any)}
      >
        <Text className="text-white text-lg font-bold">Contact Support</Text>
      </TouchableOpacity>
    </View>
  );
};

export default OrderTrackingScreen;
