import { MaterialCommunityIcons } from "@expo/vector-icons";
import { View } from "react-native";

export const StarRating = ({
  rating,
  size = 16,
}: {
  rating: number;
  size?: number;
}) => {
  // Round to nearest 0.5 first
  const roundedRating = Math.round(rating * 2) / 2;
  const fullStars = Math.floor(roundedRating);
  const hasHalfStar = roundedRating % 1 !== 0;

  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      {[...Array(5)].map((_, index) => {
        if (index < fullStars) {
          return (
            <MaterialCommunityIcons
              key={index}
              name="star"
              size={size}
              color="#9AC26B"
            />
          );
        }
        if (hasHalfStar && index === fullStars) {
          return (
            <MaterialCommunityIcons
              key={index}
              name="star-half"
              size={size}
              color="#9AC26B"
            />
          );
        }
        return (
          <MaterialCommunityIcons
            key={index}
            name="star-outline"
            size={size}
            color="#9AC26B"
          />
        );
      })}
    </View>
  );
};