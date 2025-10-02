import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
  Platform,
  ActivityIndicator,
} from 'react-native';
import {
  Text,
  Appbar,
  Card,
  Avatar,
  TextInput,
  Button,
  useTheme,
} from 'react-native-paper';
import { useGetBookMarks } from '@/services/mutation/feedMutation';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { friendlyTime } from '@/utils/friendlyTimeUtil';
import { useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import {
  useAddBookMark,
  useAddComment,
  useLikePost,
  useSharePost,
} from '@/services/mutation/feedMutation';
import { useAuth } from '@/context/auth';
import { useGetUser } from '@/services/mutation/authMutation';
import { normalizeImageUrl } from '@/utils/imageUrl';
import { safeCount } from '@/utils/count';

// Import SVG icons
import LikeIcon from '@/assets/icons/like.svg';
import LikedIcon from '@/assets/icons/liked.svg';
import CommentIcon from '@/assets/icons/comment.svg';
import ShareIcon from '@/assets/icons/share.svg';
import BookmarkIcon from '@/assets/icons/bookmark.svg';
import BookmarkedIcon from '@/assets/icons/bookmarked.svg';
import { i18n } from '@/app/_layout';

const { height: screenHeight } = Dimensions.get('window');

const SavedPostsScreen = () => {
  const theme = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const { data: bookmarks = [], refetch } = useGetBookMarks();
  const queryClient = useQueryClient();
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [isCommentsVisible, setIsCommentsVisible] = useState(false);
  const [newComment, setNewComment] = useState('');
  const overlayY = useRef(new Animated.Value(screenHeight)).current;
  const commentsListRef = useRef<FlatList>(null);
  const { mutateAsync: likePost } = useLikePost();
  const { mutateAsync: addComment } = useAddComment();
  const { mutateAsync: bookmarkPost } = useAddBookMark();
  const { mutateAsync: sharePost } = useSharePost();
  const { user: userInfo } = useAuth();
  const { data: user, isLoading: isUserLoading } = useGetUser(
    userInfo?.id || userInfo?.user_id
  );

  const CustomIconButton = ({
    IconComponent,
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

  const updateBookmarkCaches = (
    postId: string,
    updater: (post: any) => any
  ) => {
    queryClient.setQueryData(['bookMarkPosts'], (oldData: any) => {
      if (!Array.isArray(oldData)) {
        return oldData;
      }
      return oldData.map((post: any) =>
        post.id === postId ? updater(post) : post
      );
    });

    queryClient.setQueryData(['posts'], (oldData: any) => {
      if (!Array.isArray(oldData)) {
        return oldData;
      }
      return oldData.map((post: any) =>
        post.id === postId ? updater(post) : post
      );
    });

    setSelectedPost((prev) => (prev?.id === postId ? updater(prev) : prev));
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: i18n.t('refresh_failed_toast_title'),
        text2: i18n.t('could_not_refresh_saved_posts_toast_message'),
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleLike = async (postId: string) => {
    const toggleLike = (post: any) => {
      const likeValue = Number(post.likes_count ?? 0);
      return {
        ...post,
        is_liked: !post.is_liked,
        likes_count: post.is_liked ? Math.max(0, likeValue - 1) : likeValue + 1,
      };
    };

    updateBookmarkCaches(postId, toggleLike);

    try {
      await likePost(postId);
    } catch (error) {
      updateBookmarkCaches(postId, toggleLike);
      Toast.show({
        type: 'error',
        text1: i18n.t('like_failed_toast_title'),
        text2: i18n.t('could_not_like_post_toast_message'),
      });
    }
  };

  const addCommentToPost = async (postId: string) => {
    const commentText = newComment.trim();
    if (!commentText) {
      return;
    }

    const optimisticComment = {
      id: `temp-${Date.now()}`,
      text: commentText,
      created_at: new Date().toISOString(),
      user: {
        full_name: userInfo?.full_name || user?.full_name || '',
        image: user?.image,
      },
    };

    const previousBookmarks = queryClient.getQueryData(['bookMarkPosts']);
    const previousPosts = queryClient.getQueryData(['posts']);
    const previousSelectedPost = selectedPost;

    setNewComment('');
    updateBookmarkCaches(postId, (post: any) => ({
      ...post,
      comments: [...(post.comments || []), optimisticComment],
    }));
    requestAnimationFrame(() => {
      commentsListRef.current?.scrollToEnd({ animated: true });
    });
    try {
      await addComment({ post: postId, text: commentText });
    } catch (error) {
      queryClient.setQueryData(['bookMarkPosts'], previousBookmarks);
      queryClient.setQueryData(['posts'], previousPosts);
      setSelectedPost(previousSelectedPost);
      setNewComment(commentText);
      Toast.show({
        type: 'error',
        text1: i18n.t('comment_failed_toast_title'),
        text2: i18n.t('could_not_add_comment_toast_message'),
      });
    }
  };

  const openCommentsModal = (post: any) => {
    setSelectedPost(post);
    setIsCommentsVisible(true);
    setNewComment('');
  };

  const handleBookmarkToggle = async (post: any) => {
    const wasBookmarked = post.is_bookmarked;
    const postId = post.id;

    const previousBookmarks = queryClient.getQueryData(['bookMarkPosts']);
    const previousPosts = queryClient.getQueryData(['posts']);
    const previousSelectedPost = selectedPost;

    queryClient.setQueryData(['posts'], (oldData: any) => {
      if (!Array.isArray(oldData)) {
        return oldData;
      }
      return oldData.map((item: any) =>
        item.id === postId
          ? { ...item, is_bookmarked: !item.is_bookmarked }
          : item
      );
    });

    queryClient.setQueryData(['bookMarkPosts'], (oldData: any) => {
      if (!Array.isArray(oldData)) {
        return oldData;
      }
      if (wasBookmarked) {
        return oldData.filter((item: any) => item.id !== postId);
      }

      const updatedPost = { ...post, is_bookmarked: true };
      const exists = oldData.some((item: any) => item.id === postId);
      if (exists) {
        return oldData.map((item: any) =>
          item.id === postId ? updatedPost : item
        );
      }
      return [updatedPost, ...oldData];
    });

    setSelectedPost((prev) =>
      prev?.id === postId
        ? { ...prev, is_bookmarked: !prev.is_bookmarked }
        : prev
    );

    try {
      await bookmarkPost(postId);
    } catch (error) {
      queryClient.setQueryData(['bookMarkPosts'], previousBookmarks);
      queryClient.setQueryData(['posts'], previousPosts);
      setSelectedPost(previousSelectedPost);
      Toast.show({
        type: 'error',
        text1: i18n.t('bookmark_failed_toast_title'),
        text2: i18n.t('could_not_bookmark_post_toast_message'),
      });
    }
  };

  const closeComments = () => {
    Animated.timing(overlayY, {
      toValue: screenHeight,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setIsCommentsVisible(false));
  };

  const handleShare = async (post: any) => {
    let shareIncremented = false;
    const increaseShareCount = () => {
      updateBookmarkCaches(post.id, (item: any) => {
        const shareValue = safeCount(item.shares_count);
        return {
          ...item,
          shares_count: shareValue + 1,
        };
      });
      shareIncremented = true;
    };

    const decreaseShareCount = () => {
      if (!shareIncremented) {
        return;
      }
      updateBookmarkCaches(post.id, (item: any) => {
        const shareValue = safeCount(item.shares_count);
        return {
          ...item,
          shares_count: Math.max(0, shareValue - 1),
        };
      });
      shareIncremented = false;
    };

    try {
      const webLink = `https://alphafeed.com/post/${post.id}`;
      const downloadLink = 'https://alphafeed.com/download';
      const imageUrl = normalizeImageUrl(post.image) || webLink;

      if (Platform.OS === 'web') {
        const shareData = {
          title: post.caption || i18n.t('check_out_this_post_share_title'),
          text: `${post.caption}\n\n${i18n.t('shared_via_app_text')}`,
          url: webLink,
        };

        if (navigator.share) {
          await navigator.share(shareData);
          increaseShareCount();
          await sharePost(post.id);
        } else if (navigator.clipboard) {
          await navigator.clipboard.writeText(`${shareData.text}\n${webLink}`);
          Toast.show({
            type: 'success',
            text1: i18n.t('link_copied_toast_title'),
            text2: i18n.t('post_link_copied_toast_message'),
          });
          increaseShareCount();
          await sharePost(post.id);
        }
      } else {
        const shareOptions = {
          title: i18n.t('share_post_share_title'),
          message: `${post.caption}\n\n${i18n.t(
            'get_the_app_share_message'
          )}: ${downloadLink}`,
          url: imageUrl,
        };

        if (Platform.OS === 'ios') {
          const { default: RNShare } = await import('react-native-share');
          const result = await RNShare.open(shareOptions);
          if (result) {
            increaseShareCount();
            await sharePost(post.id);
          }
        } else {
          const { default: RNShare } = await import('react-native-share');
          await RNShare.open(shareOptions);
          increaseShareCount();
          await sharePost(post.id);
        }
      }
    } catch (error: any) {
      decreaseShareCount();
      if (!error?.message?.includes('User did not share')) {
        Toast.show({
          type: 'error',
          text1: i18n.t('share_failed_toast_title'),
          text2: i18n.t('could_not_share_post_toast_message'),
        });
      }
    }
  };

  useEffect(() => {
    if (isCommentsVisible) {
      Animated.timing(overlayY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isCommentsVisible, overlayY]); // Added overlayY to dependency array

  return (
    <SafeAreaView style={styles.container}>
      <Appbar.Header style={styles.header}>
        <Appbar.BackAction
          onPress={() => router.push('/(protected)/profile')}
        />
        <Appbar.Content title={i18n.t('saved_posts_title')} />
      </Appbar.Header>

      <FlatList
        data={bookmarks}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.postCard}>
            <Card.Title
              title={item.user}
              subtitle={`${item.location} • ${friendlyTime(item.time_ago)}`}
              left={() => (
                <TouchableOpacity
                  onPress={() => {
                    router.push(`/restaurant-profile`);
                  }}
                >
                  <Avatar.Image
                    size={44}
                    source={{
                      uri: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                        item.user
                      )}`,
                    }}
                    style={styles.avatar}
                  />
                </TouchableOpacity>
              )}
              titleStyle={styles.userName}
              subtitleStyle={styles.subtitle}
            />
            <Card.Cover
              source={{ uri: normalizeImageUrl(item.image) }}
              style={styles.postImage}
            />
            <Card.Content style={styles.content}>
              <View style={styles.postActions}>
                <View style={styles.actionItem}>
                  <CustomIconButton
                    IconComponent={<LikeIcon width={22} height={22} />}
                    activeIcon={<LikedIcon width={22} height={22} />}
                    isActive={item.is_liked}
                    onPress={() => handleLike(item.id)}
                  />
                  <Text style={styles.actionText}>
                    {safeCount(item.likes_count)}
                  </Text>
                </View>

                <View style={styles.actionItem}>
                  <CustomIconButton
                    IconComponent={<CommentIcon width={22} height={22} />}
                    onPress={() => openCommentsModal(item)}
                  />
                  <Text style={styles.actionText}>
                    {safeCount(item.comments?.length ?? 0)}
                  </Text>
                </View>

                <View style={styles.actionItem}>
                  <CustomIconButton
                    IconComponent={<ShareIcon width={22} height={22} />}
                    onPress={() => handleShare(item)}
                  />
                  <Text style={styles.actionText}>
                    {safeCount(item.shares_count)}
                  </Text>
                </View>

                <View style={styles.spacer} />

                <CustomIconButton
                  IconComponent={
                    <BookmarkIcon width={22} height={22} fill="#666" />
                  }
                  activeIcon={
                    <BookmarkedIcon width={22} height={22} fill="#666" />
                  }
                  isActive={item.is_bookmarked}
                  onPress={() => handleBookmarkToggle(item)}
                />
              </View>

              <View style={styles.captionContainer}>
                <Text style={styles.caption} numberOfLines={1}>
                  <Text style={styles.userName}>{item.user} </Text>
                  {item.caption}
                </Text>
                {item.caption.length > 50 && (
                  <TouchableOpacity onPress={() => openCommentsModal(item)}>
                    <Text style={styles.moreLink}>{i18n.t('more_link')}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </Card.Content>
          </View>
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#96B76E']}
            progressBackgroundColor="#ffffff"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {i18n.t('no_saved_posts_yet_text')}
            </Text>
            <TouchableOpacity onPress={() => router.push('/(protected)/feed')}>
              <Text style={styles.exploreLink}>
                {i18n.t('explore_posts_link')}
              </Text>
            </TouchableOpacity>
          </View>
        }
        contentContainerStyle={styles.listContentContainer}
      />

      {isCommentsVisible && (
        <View style={styles.overlayContainer}>
          <TouchableWithoutFeedback onPress={closeComments}>
            <View style={styles.backdrop} />
          </TouchableWithoutFeedback>

          <Animated.View
            style={[
              styles.commentsPanel,
              { transform: [{ translateY: overlayY }] },
            ]}
          >
            <View style={styles.dragHandleContainer}>
              <View style={styles.dragHandle} />
            </View>
            <View style={styles.commentsHeader}>
              <Text style={styles.commentsTitle}>
                {i18n.t('comments_title')}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={closeComments}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.fullCaptionContainer}>
              <Avatar.Image
                size={36}
                source={{
                  uri: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                    selectedPost?.user
                  )}`,
                }}
                style={styles.captionAvatar}
              />
              <View style={styles.captionTextContainer}>
                <Text style={styles.fullCaption}>
                  <Text style={styles.userName}>{selectedPost?.user} </Text>
                  {selectedPost?.caption}
                </Text>
                <Text style={styles.captionTime}>
                  {friendlyTime(selectedPost?.time_ago)}
                </Text>
              </View>
            </View>
            <FlatList
              ref={commentsListRef}
              data={selectedPost?.comments}
              keyExtractor={(item) => item?.id?.toString()}
              renderItem={({ item }) => (
                <View style={styles.commentItem}>
                  <Avatar.Image
                    size={32}
                    source={{
                      uri:
                        normalizeImageUrl(item?.user?.image) ||
                        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                          item?.user.full_name
                        )}`,
                    }}
                    style={styles.commentAvatar}
                  />
                  <View style={styles.commentContent}>
                    <View style={styles.commentHeader}>
                      <Text style={styles.commentUser}>
                        {item?.user.full_name}
                      </Text>
                      <Text style={styles.commentTime}>
                        {friendlyTime(item?.created_at)}
                      </Text>
                    </View>
                    <Text style={styles.commentText}>{item?.text}</Text>
                  </View>
                </View>
              )}
              style={styles.commentsListContainer}
              contentContainerStyle={styles.commentsContentContainer}
              ListEmptyComponent={
                <Text style={styles.noCommentsText}>
                  {i18n.t('no_comments_text')}
                </Text>
              }
              scrollEnabled={true}
              nestedScrollEnabled={true}
            />

            <View style={styles.modalCommentInputContainer}>
              {isUserLoading ? (
                <ActivityIndicator size="small" color={theme.colors.primary} />
              ) : (
                <Avatar.Image
                  size={32}
                  source={{
                    uri:
                      normalizeImageUrl(user?.image) ||
                      `https://api.dicebear.com/7.x/initials/svg?seed=You`,
                  }}
                  style={styles.inputAvatar}
                />
              )}
              <TextInput
                mode="flat"
                placeholder={i18n.t('add_comment_placeholder')}
                value={newComment}
                onChangeText={(text) => setNewComment(text)}
                style={styles.commentInput}
                dense
                underlineColor="transparent"
                activeUnderlineColor="transparent"
                cursorColor="#96B76E"
                theme={{
                  colors: { primary: '#96B76E', placeholder: '#666' },
                  roundness: 20,
                }}
              />
              <Button
                mode="text"
                onPress={() => addCommentToPost(selectedPost?.id)}
                disabled={!newComment.trim()}
                labelStyle={[
                  styles.postButton,
                  {
                    color: newComment.trim() ? '#96B76E' : '#ccc',
                  },
                ]}
              >
                {i18n.t('post_comment_button')}
              </Button>
            </View>
          </Animated.View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDFDFC',
  },
  header: {
    backgroundColor: '#FDFDFC',
  },
  postCard: {
    marginVertical: 8,
    marginHorizontal: Platform.OS === 'web' ? 20 : 12,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
    borderBottomWidth: 1,
    borderColor: '#E0E0E0',
    ...Platform.select({
      web: {
        maxWidth: 600,
        width: '90%',
        alignSelf: 'center',
      },
    }),
  },
  avatar: {
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#f0f0f0',
  },
  postImage: {
    height: Dimensions.get('window').height * 0.36,
    width: '100%',
  },
  content: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    paddingBottom: 24,
  },
  caption: {
    fontSize: 15,
    lineHeight: 20,
    color: '#22281B',
    textOverflow: 'ellipsis',
    fontWeight: '500',
  },
  userName: {
    fontWeight: '600',
    fontSize: 14,
    color: '#333',
  },
  subtitle: {
    fontSize: 12,
    color: '#757575',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 16,
  },
  exploreLink: {
    color: '#96B76E',
    fontSize: 16,
    fontWeight: 'bold',
  },
  listContentContainer: {
    flexGrow: 1,
    ...Platform.select({
      web: {
        minHeight: '100%',
      },
    }),
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
  },
  iconButton: {
    padding: 8,
    borderRadius: 20,
  },
  spacer: {
    flex: 1,
  },
  actionText: {
    marginLeft: 0,
    fontSize: 15,
    fontWeight: '700',
    color: '#22281B',
  },
  captionContainer: {
    position: 'relative',
    top: 0,
    textOverflow: 'ellipsis',
  },
  moreLink: {
    color: '#96B76E',
    marginTop: 4,
    alignSelf: 'flex-end',
    fontSize: 14,
  },
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
    zIndex: 1000,
  },
  backdrop: {
    flex: 1,
  },
  dragHandleContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#ddd',
    borderRadius: 2,
  },
  commentsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  commentsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 18,
    color: '#666',
  },
  commentsPanel: {
    backgroundColor: '#ffffff',
    height: screenHeight * 0.8,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 16,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        maxWidth: 600,
        width: '100%',
        alignSelf: 'center',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      },
    }),
  },
  commentsListContainer: {
    flex: 1,
  },
  commentsContentContainer: {
    paddingBottom: 16,
    paddingTop: 8,
  },
  commentItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    marginBottom: 8,
  },
  fullCaptionContainer: {
    flexDirection: 'row',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  captionAvatar: {
    marginRight: 12,
    backgroundColor: '#f0f0f0',
  },
  captionTextContainer: {
    flex: 1,
  },
  fullCaption: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
  },
  captionTime: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  commentAvatar: {
    marginRight: 12,
    backgroundColor: '#f0f0f0',
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  commentUser: {
    fontWeight: '600',
    marginRight: 8,
    fontSize: 14,
    color: '#333',
  },
  commentTime: {
    fontSize: 12,
    color: '#666',
  },
  commentText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
  },
  modalCommentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  inputAvatar: {
    marginRight: 12,
    backgroundColor: '#f0f0f0',
  },
  commentInput: {
    flex: 1,
    height: 40,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 20,
  },
  postButton: {
    fontWeight: '600',
    marginLeft: 8,
    fontSize: 14,
  },
  noCommentsText: {
    textAlign: 'center',
    color: '#666',
    paddingVertical: 24,
    fontSize: 14,
  },
});

export default SavedPostsScreen;
