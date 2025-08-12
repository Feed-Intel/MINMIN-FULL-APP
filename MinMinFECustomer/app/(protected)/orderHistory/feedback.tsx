import React, { useEffect, useState } from "react";
import { View, StyleSheet, Alert, ScrollView } from "react-native";
import { TextInput, Button, Text } from "react-native-paper"; // Explicitly import Text from react-native-paper
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/FontAwesome";
import {
  useCreateFeedback,
  useGetFeedback,
} from "@/services/mutation/feedbackMutation";
import { useLocalSearchParams } from "expo-router";
import { i18n } from "@/app/_layout"; // Import i18n module

const ReviewScreen = () => {
  const params = useLocalSearchParams();
  const orderId = params.orderId;
  const menuId = params.menuId;
  const restaurantId = params.restaurantId;
  const [serviceRating, setServiceRating] = useState(0);
  const [foodRating, setFoodRating] = useState(0);
  const [waitRating, setWaitRating] = useState(0);
  const [comment, setComment] = useState("");
  const { mutate: createFeedback } = useCreateFeedback();
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);
  const { data: feedback } = useGetFeedback(orderId as string);

  useEffect(() => {
    if (feedback && feedback.length > 0) {
      setFeedbackSuccess(true);
    } else {
      setFeedbackSuccess(false);
    }
  }, [feedback]);

  const overallRating =
    serviceRating && foodRating && waitRating
      ? (serviceRating + foodRating + waitRating) / 3
      : 0;

  const handleRating = (
    setter: React.Dispatch<React.SetStateAction<number>>,
    value: number
  ) => {
    setter(value);
  };

  const submitFeedback = async () => {
    if (overallRating === 0) {
      // Replaced hardcoded Alert message with i18n.t()
      Alert.alert(
        i18n.t("rating_required_alert_title"),
        i18n.t("rating_required_alert_message")
      );
      return;
    }

    createFeedback(
      {
        order: orderId,
        menu: menuId,
        restaurant: restaurantId,
        service_rating: serviceRating,
        food_rating: foodRating,
        wait_rating: waitRating,
        overall_rating: overallRating,
        comment,
      },
      {
        onSuccess: () => {
          setFeedbackSuccess(true);
        },
        onError: (error) => {
          console.error("Failed to submit feedback:", error);
          // Optionally, show a toast or alert for submission failure
          Alert.alert(
            i18n.t("error_toast_title"),
            i18n.t("feedback_submission_failed_alert")
          );
        },
      }
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.card}>
        <Text style={styles.title}>{i18n.t("leave_a_review_title")}</Text>
        <Text style={styles.message}>{i18n.t("review_message")}</Text>

        {!feedbackSuccess ? (
          <>
            <Text style={styles.label}>{i18n.t("rate_service_label")}:</Text>
            <View style={styles.ratingContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Icon
                  key={star}
                  name={star <= serviceRating ? "star" : "star-o"}
                  size={30}
                  color="#96B76E"
                  onPress={() => handleRating(setServiceRating, star)}
                />
              ))}
            </View>

            <Text style={styles.label}>{i18n.t("rate_food_label")}:</Text>
            <View style={styles.ratingContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Icon
                  key={star}
                  name={star <= foodRating ? "star" : "star-o"}
                  size={30}
                  color="#96B76E"
                  onPress={() => handleRating(setFoodRating, star)}
                />
              ))}
            </View>

            <Text style={styles.label}>{i18n.t("rate_wait_time_label")}:</Text>
            <View style={styles.ratingContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Icon
                  key={star}
                  name={star <= waitRating ? "star" : "star-o"}
                  size={30}
                  color="#96B76E"
                  onPress={() => handleRating(setWaitRating, star)}
                />
              ))}
            </View>

            <TextInput
              placeholder={i18n.t("comment_placeholder")}
              value={comment}
              onChangeText={setComment}
              multiline={true}
              numberOfLines={80} // Consider if this large number is necessary or if a fixed height is better
              activeUnderlineColor="transparent"
              style={styles.input}
              underlineColor="transparent"
            />
            <Button
              onPress={submitFeedback}
              style={styles.button}
              mode="contained"
              textColor="#000"
              theme={{ colors: { primary: "#96B76E" } }}
            >
              {i18n.t("submit_feedback_button")}
            </Button>
          </>
        ) : (
          <Text style={styles.label}>
            {i18n.t("thank_you_feedback_message")}
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FDFDFC",
  },
  card: {
    width: "90%",
    paddingTop: 20,
    backgroundColor: "#FDFDFC",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 10,
  },
  message: {
    textAlign: "center",
    marginVertical: 10,
    color: "#666",
  },
  label: {
    marginTop: 15,
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 16,
  },
  ratingContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    marginVertical: 10,
  },
  input: {
    minHeight: 130,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderRadius: 24,
    backgroundColor: "#546D3617",
  },
  button: {
    marginTop: 10,
    marginBottom: 20,
    borderRadius: 24,
  },
});

export default ReviewScreen;
