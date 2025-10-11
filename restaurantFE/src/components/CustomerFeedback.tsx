import { useGetFeedback } from '@/services/mutation/feedbackMutation';
import { useGetPosts } from '@/services/mutation/feedMutations';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import Pagination from './Pagination';

// --- Mock Data ---
const reviewsData = [
  {
    id: 1,
    name: 'Avery Lane',
    avatarUrl: 'https://placehold.co/100x100/A3D5D2/000?text=AL',
    rating: 4.5,
    text: "I had an amazing time at the restaurant! The service was top-notch, with friendly staff who ensured we felt welcomed throughout our meal. The food was incredibly tasty, full of flavor and beautifully presented. Each dish was made with care, highlighting a mix of ingredients that worked well together. I was genuinely impressed by the quality and attention to detail, making it a dining experience I can't wait to enjoy again!",
    reply: {
      accountName: 'GourmetBites',
      accountType: 'Official Account',
      avatarUrl: 'https://placehold.co/100x100/E0E0E0/444?text=GB',
      replyText: 'Thank you for your kind words!',
      likes: 5,
      dislikes: 0,
      comments: 0,
    },
  },
  {
    id: 2,
    name: 'Dorian Hale',
    avatarUrl: 'https://placehold.co/100x100/B0C4DE/000?text=DH',
    rating: 3.5,
    text: 'An unforgettable culinary journey.',
    reply: null,
  },
  {
    id: 3,
    name: 'Evelyn Frost',
    avatarUrl: 'https://placehold.co/100x100/DDA0DD/000?text=EF',
    rating: 2.5,
    text: 'The flavors were truly out of this world, bursting with a delightful combination of spices and ingredients that danced on my palate.',
    reply: null,
  },
];

// --- Sub-Components ---

/**
 * Generates the star rating display based on a decimal rating value.
 * Uses unicode characters for stars.
 * @param {number} rating The rating from 0.0 to 5.0
 */
const StarRating = ({ rating }: { rating: any }) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating - fullStars >= 0.25 && rating - fullStars <= 0.75; // Adjusting for visual approximation
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
  const stars = [];

  for (let i = 0; i < fullStars; i++) {
    stars.push('★');
  }
  if (hasHalfStar) {
    stars.push('★');
  }
  for (let i = 0; i < emptyStars; i++) {
    stars.push('☆');
  }

  return <Text style={styles.starRating}>{stars.slice(0, 5).join('')}</Text>;
};

/**
 * Component for rendering the official reply inside a review.
 */
const OfficialReply = ({ reply }: { reply: any }) => (
  <View style={styles.replyContainer}>
    <View style={styles.replyHeader}>
      <Image source={{ uri: reply.avatarUrl }} style={styles.replyAvatar} />
      <View>
        <Text style={styles.replyAccountName}>{reply.accountName}</Text>
        <Text style={styles.replyAccountType}>{reply.accountType}</Text>
      </View>
    </View>
    <Text style={styles.replyText}>{reply.replyText}</Text>
    <View style={styles.replyActions}>
      <View style={styles.actionItem}>
        <Text style={styles.actionIcon}>👍</Text>
        <Text style={styles.actionCount}>{reply.likes}</Text>
      </View>
      <View style={styles.actionItem}>
        <Text style={styles.actionIcon}>👎</Text>
        <Text style={styles.actionCount}>{reply.dislikes}</Text>
      </View>
      <View style={styles.actionItem}>
        <Text style={styles.actionIcon}>💬</Text>
        <Text style={styles.actionCount}>{reply.comments}</Text>
      </View>
    </View>
  </View>
);

/**
 * Component for a single customer review card.
 */
const ReviewCard = ({ review }: { review: any }) => {
  const handleReplyPress = () => {
    // In a real app, this would open a reply input field/modal
    console.log(`Replying to review ${review.id}`);
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.profileInfo}>
          <Image source={{ uri: review.avatarUrl }} style={styles.avatar} />
          <Text style={styles.name}>{review.customer.full_name}</Text>
        </View>
        <StarRating rating={review.food_rating} />
      </View>

      <Text style={styles.reviewText}>{review.comment}</Text>

      {/* {review.reply && <OfficialReply reply={review.reply} />} */}

      {/* <View style={styles.footer}>
        <TouchableOpacity style={styles.replyButton} onPress={handleReplyPress}>
          <Text style={styles.replyButtonText}>Reply</Text>
        </TouchableOpacity>
      </View> */}
    </View>
  );
};

// --- Main Component ---

export default function CustomerFeedback() {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const { data: reviewsData } = useGetFeedback(currentPage);
  return (
    <ScrollView style={styles.container}>
      <Text style={{ fontWeight: 'bold', marginBottom: 10 }}>
        Reviews ({reviewsData?.count})
      </Text>
      {reviewsData?.results.map((review: any) => (
        <ReviewCard key={review.id} review={review} />
      ))}
      <View style={{ height: 50 }} />
      <Pagination
        totalPages={reviewsData?.count || 0}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
      />
    </ScrollView>
  );
}

// --- Styles ---

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingLeft: 16,
    backgroundColor: '#D2DEC400', // Light background for the screen
  },
  card: {
    backgroundColor: '#546D3617',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0', // Subtle border
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: '#ccc',
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  starRating: {
    fontSize: 18,
    color: '#FFD700', // Gold color for stars
    letterSpacing: 2,
  },
  reviewText: {
    fontSize: 14,
    color: '#444',
    lineHeight: 20,
    marginBottom: 16,
  },
  // --- Official Reply Styles ---
  replyContainer: {
    backgroundColor: '#f0fcf0', // Very light green background for the reply
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d0f0d0',
    marginBottom: 12,
  },
  replyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  replyAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 8,
    backgroundColor: '#ddd',
  },
  replyAccountName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e8449', // Darker green for official account name
  },
  replyAccountType: {
    fontSize: 11,
    color: '#555',
  },
  replyText: {
    fontSize: 13,
    color: '#333',
    lineHeight: 18,
    marginLeft: 36, // Align with the reply text content
  },
  replyActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginLeft: 36,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
  },
  actionIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  actionCount: {
    fontSize: 12,
    color: '#666',
  },
  // --- Footer/Reply Button Styles ---
  footer: {
    alignItems: 'flex-end',
  },
  replyButton: {
    backgroundColor: '#6b8e23', // Olive green for the reply button
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3, // Android shadow
  },
  replyButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});
