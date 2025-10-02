import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Button, TextInput } from 'react-native'; // Ensure TextInput is from 'react-native' if not using paper's
import Icon from 'react-native-vector-icons/FontAwesome';
import {
  useCreateFeedback,
  useGetFeedback,
} from '@/services/mutation/feedbackMutation';
import { useLocalSearchParams } from 'expo-router';
import { i18n } from '@/app/_layout';

const ReviewScreen = () => {
  const params = useLocalSearchParams();
  const orderId = params.orderId;
  const menuId = params.menuId;
  const restaurantId = params.restaurantId;
  const [serviceRating, setServiceRating] = useState(0);
  const [foodRating, setFoodRating] = useState(0);
  const [waitRating, setWaitRating] = useState(0);
  const [comment, setComment] = useState('');
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
      Alert.alert(
        i18n.t('rating_required_alert_title'),
        i18n.t('rating_required_alert_message')
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
          console.error(i18n.t('feedback_submission_error'), error);
          Alert.alert(
            i18n.t('error_toast_title'),
            i18n.t('feedback_submission_failed_alert')
          );
        },
      }
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>{i18n.t('leave_review_title')}</Text>
        <Text style={styles.message}>{i18n.t('feedback_message')}</Text>

        {!feedbackSuccess ? (
          <>
            <Text style={styles.label}>{i18n.t('rate_service_label')}:</Text>
            <View style={styles.ratingContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Icon
                  key={star}
                  name={star <= serviceRating ? 'star' : 'star-o'}
                  size={30}
                  color="#4CAF50"
                  onPress={() => handleRating(setServiceRating, star)}
                />
              ))}
            </View>

            <Text style={styles.label}>{i18n.t('rate_food_label')}:</Text>
            <View style={styles.ratingContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Icon
                  key={star}
                  name={star <= foodRating ? 'star' : 'star-o'}
                  size={30}
                  color="#4CAF50"
                  onPress={() => handleRating(setFoodRating, star)}
                />
              ))}
            </View>

            <Text style={styles.label}>{i18n.t('rate_wait_time_label')}:</Text>
            <View style={styles.ratingContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Icon
                  key={star}
                  name={star <= waitRating ? 'star' : 'star-o'}
                  size={30}
                  color="#4CAF50"
                  onPress={() => handleRating(setWaitRating, star)}
                />
              ))}
            </View>

            <TextInput
              placeholder={i18n.t('comment_optional_placeholder')}
              value={comment}
              onChangeText={setComment}
              multiline
              style={styles.input}
            />

            <View style={styles.button}>
              <Button
                title={i18n.t('submit_feedback_button')}
                onPress={submitFeedback}
                color="#6200EE"
              />
            </View>
          </>
        ) : (
          <Text style={styles.label}>{i18n.t('thank_you_feedback_text')}</Text>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  card: {
    width: '90%',
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 10,
  },
  message: {
    textAlign: 'center',
    marginVertical: 10,
    color: '#666',
  },
  label: {
    marginTop: 15,
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 16,
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 10,
  },
  input: {
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 10,
    backgroundColor: '#fff',
  },
  button: {
    marginTop: 10,
    padding: 10,
    borderRadius: 4,
  },
});

export default ReviewScreen;
