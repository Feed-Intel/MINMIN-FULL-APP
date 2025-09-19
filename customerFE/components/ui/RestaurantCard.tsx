import * as React from "react";
import {
  View,
  Image,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from "react-native";
import { Card, Text, Button } from "react-native-paper";
import LikeIcon from "@/assets/icons/like.svg";
import LikedIcon from "@/assets/icons/liked.svg";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { i18n } from "@/app/_layout";
import { normalizeImageUrl } from "@/utils/imageUrl";

export const RestaurantCards = ({ data, rounded }: any) => {
  return (
    <View>
      {data.map((item: any, index: number) => (
        <RestaurantCard key={index} item={item} rounded={rounded} />
      ))}
    </View>
  );
};

const RestaurantCard = ({ item, rounded, callBack }: any) => {
  const [liked, setLiked] = React.useState(false);
  const handleCardPress = () => {
    router.push({
      pathname: "/restaurant-profile",
      params: { id: item.tenant_id },
    });
  };

  const handleGoogleMapsPress = (e: any) => {
    e.stopPropagation(); // Prevent card navigation when button is pressed

    // Extract location data from the item
    const coordinates = item.location?.coordinates;
    const address = item.branchAddress;
    const restaurantName = item.restaurant_name;

    let url = "";

    // Use coordinates if available
    if (coordinates && coordinates.length === 2) {
      const [lng, lat] = coordinates;
      url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    }
    // Use address if coordinates not available
    else if (address) {
      url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        address
      )}`;
    }
    // Fallback to restaurant name
    else {
      url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        restaurantName
      )}`;
    }

    // Open Google Maps
    Linking.openURL(url).catch((err) =>
      console.error("Failed to open Google Maps:", err)
    );
  };

  return (
    <TouchableOpacity onPress={callBack || handleCardPress} activeOpacity={0.9}>
      <View style={styles.card}>
        <Card.Content
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            paddingTop: 10,
          }}
        >
          <View style={{ flexDirection: "column" }}>
            <Text style={styles.title}>{item.restaurant_name}</Text>
            <View style={styles.row}>
              <MaterialCommunityIcons name="star" color="green" size={18} />
              <Text style={styles.rating}>
                {item.average_rating ? item.average_rating.toFixed(1) : "N/A"}
              </Text>
              <Text style={styles.dot}>·</Text>
              <Text style={styles.category}>Vegan</Text>
            </View>
          </View>
          {rounded && (
            <CustomIconButton
              IconComponent={<LikeIcon width={22} height={22} />}
              activeIcon={<LikedIcon width={22} height={22} />}
              isActive={liked}
              onPress={() => setLiked(!liked)}
            />
          )}
        </Card.Content>

        <View style={styles.imageGrid}>
          <Image
            style={{ ...styles.mainImage, borderRadius: rounded ? 8 : 0 }}
            source={{
              uri: normalizeImageUrl(item.sampleDishes[0]),
            }}
          />
          <View style={styles.sideImages}>
            <Image
              style={{ ...styles.sideImage, borderRadius: rounded ? 8 : 0 }}
              source={{
                uri: normalizeImageUrl(item?.sampleDishes[1]),
              }}
            />
            <Image
              style={{ ...styles.sideImage, borderRadius: rounded ? 8 : 0 }}
              source={{
                uri: normalizeImageUrl(item?.sampleDishes[2]),
              }}
            />
          </View>
        </View>

        {!rounded && (
          <Card.Content style={styles.footer}>
            <View style={styles.row}>
              <MaterialCommunityIcons
                name="map-marker"
                color={"#6B894E"}
                size={18}
              />
              <Text style={styles.distance}>
                {item.distanceKm
                  ? `${item.distanceKm.toFixed(1)} ${i18n.t("distance_from_location_text")}`
                  : i18n.t("nearby_text")}
              </Text>
            </View>
            <Button
              mode="text"
              onPress={handleGoogleMapsPress}
              textColor="#f37042"
              labelStyle={{ textDecorationLine: "underline" }}
              style={styles.link}
            >
              {i18n.t("view_on_google_maps_button")}
            </Button>
          </Card.Content>
        )}
      </View>
    </TouchableOpacity>
  );
};

const CustomIconButton = ({
  IconComponent,
  size = 22,
  color = "#666",
  onPress,
  activeIcon,
  isActive,
}: {
  IconComponent: React.ReactNode;
  size?: number;
  color?: string;
  onPress: () => void;
  activeIcon?: React.ReactNode;
  isActive?: boolean;
}) => (
  <TouchableOpacity
    onPress={onPress}
    style={styles.iconButton}
    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
  >
    {isActive ? activeIcon : IconComponent}
  </TouchableOpacity>
);
const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    // elevation: 2,
    backgroundColor: "#FEFEFD",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  title: {
    fontSize: 20,
    marginBottom: 2,
  },
  subTitle: {
    fontSize: 14,
    marginBottom: 2,
    color: "#6B894E",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  rating: {
    marginHorizontal: 4,
    fontSize: 14,
    color: "black",
  },
  dot: {
    marginHorizontal: 2,
    fontSize: 14,
    color: "#666",
  },
  category: {
    fontSize: 14,
    color: "#666",
  },
  imageGrid: {
    flexDirection: "row",
    padding: 8,
  },
  mainImage: {
    width: "60%",
    height: 190,
  },
  sideImages: {
    flex: 1,
    marginLeft: 6,
    justifyContent: "space-between",
  },
  sideImage: {
    width: "100%",
    height: 92,
    borderRadius: 8,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    justifyContent: "space-between",
  },
  distance: {
    marginLeft: 4,
    fontSize: 12,
    color: "#555",
    flexShrink: 1,
  },
  link: {
    fontSize: 8,
    alignSelf: "flex-start",
  },
  iconButton: {
    padding: 8,
    borderRadius: 20,
  },
});

export default RestaurantCard;
