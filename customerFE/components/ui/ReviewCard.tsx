import * as React from "react";
import { View, StyleSheet } from "react-native";
import { Avatar, Card, Text } from "react-native-paper";
import { MaterialIcons } from "@expo/vector-icons"; // Import MaterialIcons
import { normalizeImageUrl } from "@/utils/imageUrl";

type ReviewCardProps = {
  userName: string;
  timeAgo: string;
  reviewText: string;
  rating: number;
  userAvatarUrl: string;
};

export default function ReviewCard({
  userName,
  timeAgo,
  reviewText,
  rating,
  userAvatarUrl,
}: ReviewCardProps) {
  // Function to render star icons based on the rating
  const renderStars = (currentRating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <MaterialIcons
          key={i}
          name={i <= currentRating ? "star" : "star-border"} // 'star' for filled, 'star-border' for empty
          size={20}
          color="#617D3E" // The specific color requested
          style={styles.starIcon}
        />
      );
    }
    return <View style={styles.starContainer}>{stars}</View>;
  };

  return (
    <Card style={styles.card}>
      <Card.Content>
        {/* Header Section: Avatar, Name, and Time */}
        <View style={styles.header}>
          <Avatar.Image
            size={40}
            source={{ uri: normalizeImageUrl(userAvatarUrl) }}
          />
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{userName}</Text>
            <Text style={styles.timeAgo}>{timeAgo}</Text>
          </View>
        </View>

        {/* Star Rating Section */}
        {renderStars(rating)}

        {/* Review Text Section */}
        <Text style={styles.reviewText}>{reviewText}</Text>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  card: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 10,
    elevation: 0,
    backgroundColor: "transparent",
    shadowColor: "transparent",
    borderWidth: 0,
    borderColor: "transparent",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  userInfo: {
    marginLeft: 10,
  },
  userName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  timeAgo: {
    fontSize: 12,
    color: "#777",
  },
  starContainer: {
    flexDirection: "row",
    marginBottom: 10,
  },
  starIcon: {
    marginRight: 2, // Small space between stars
  },
  reviewText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#444",
  },
});
