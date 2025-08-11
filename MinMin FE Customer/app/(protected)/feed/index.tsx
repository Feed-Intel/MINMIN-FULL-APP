import React, { useEffect, useState, useRef } from "react";
import {
  StyleSheet,
  View,
  Platform,
  Animated,
  FlatList,
  Dimensions,
  TouchableOpacity,
  TouchableWithoutFeedback,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import {
  Card,
  Button,
  Avatar,
  Badge,
  TextInput,
  Text, // Explicitly import Text from react-native-paper if used as such, otherwise use from react-native
  useTheme,
} from "react-native-paper";

import { i18n } from "@/app/_layout";
import {
  useAddBookMark,
  useAddComment,
  useGetBookMarks,
  useGetPosts,
  useLikePost,
  useSharePost,
} from "@/services/mutation/feedMutation";
import { friendlyTime } from "@/utils/friendlyTimeUtil";
import { useQueryClient } from "@tanstack/react-query";
import { useGetNotifications } from "@/services/mutation/notificationMutation";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useAuth } from "@/context/auth";
import { useGetUser } from "@/services/mutation/authMutation"; // Keep useGetUser as it's used for user avatar
import { ThemedView } from "@/components/ThemedView";

// Asset imports
import AvatarImage from "@/assets/images/avatar.jpg";
import LikeIcon from "@/assets/icons/like.svg";
import LikedIcon from "@/assets/icons/liked.svg";
import NotificationIcon from "@/assets/icons/notification_icon.svg";
import CommentIcon from "@/assets/icons/comment.svg";
import ShareIcon from "@/assets/icons/share.svg";
import BookmarkIcon from "@/assets/icons/bookmark.svg";
import BookmarkedIcon from "@/assets/icons/bookmarked.svg";
import Toast from "react-native-toast-message";
import * as WebBrowser from "expo-web-browser";

const { height: screenHeight, width: screenWidth } = Dimensions.get("window");
type WebShareParams = {
  title?: string;
  text?: string;
  url: string;
};

const FoodFeedScreen = () => {
  const theme = useTheme();
  const headerAnimation = useRef(new Animated.Value(0)).current;
  const contentAnimation = useRef(new Animated.Value(0)).current;
  const { data: posts = [], isLoading, refetch: refetchPosts } = useGetPosts();
  const [refreshing, setRefreshing] = useState(false);
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState("");
  // const [visible, setVisible] = useState(false); // Removed: This state was unused
  const { mutateAsync: likePost } = useLikePost();
  const { mutateAsync: addComment } = useAddComment();
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [isCommentsVisible, setIsCommentsVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showBookmarks, setShowBookmarks] = useState(false);
  const overlayY = useRef(new Animated.Value(screenHeight)).current;
  const { mutateAsync: bookmarkPost } = useAddBookMark();
  const { data: bookmarks = [], refetch } = useGetBookMarks();
  // const [isListAtTop, setIsListAtTop] = useState(true); // Removed: This state was unused
  const commentsListRef = useRef<FlatList>(null);
  const { data: notifications = [] } = useGetNotifications();
  const { mutateAsync: sharePost } = useSharePost();
  const filteredPosts = showBookmarks
    ? bookmarks
    : posts.filter(
        (post) =>
          post.caption.toLowerCase().includes(searchQuery.toLowerCase()) ||
          post.tags.some((tag: string) =>
            tag.toLowerCase().includes(searchQuery.toLowerCase())
          )
      );
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

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerAnimation, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(contentAnimation, {
        toValue: 1,
        duration: 1200,
        delay: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [headerAnimation, contentAnimation]);

  useEffect(() => {
    if (isCommentsVisible) {
      Animated.timing(overlayY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isCommentsVisible, overlayY]);

  const navigation = useNavigation();
  useEffect(() => {
    const unsubscribe = navigation.addListener("tabPress" as any, () => {
      setShowBookmarks(false);
    });
    return unsubscribe;
  }, [navigation]);

  useFocusEffect(
    React.useCallback(() => {
      setShowBookmarks(false);
    }, [])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      if (showBookmarks) {
        await refetch();
      } else {
        await refetchPosts();
      }
    } catch (error) {
      console.error(i18n.t("refresh_failed_error"), error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleLike = async (postId: string) => {
    // Optimistic update for immediate UI feedback
    queryClient.setQueryData(["posts"], (oldData: any) => {
      return oldData.map((post: any) => {
        if (post.id === postId) {
          return {
            ...post,
            is_liked: !post.is_liked,
            likes_count: post.is_liked
              ? post.likes_count - 1
              : post.likes_count + 1,
          };
        }
        return post;
      });
    });

    try {
      await likePost(postId);
      // Refetch to ensure data consistency
      await refetchPosts();
    } catch (error) {
      // Revert on error
      queryClient.setQueryData(["posts"], (oldData: any) => {
        return oldData.map((post: any) => {
          if (post.id === postId) {
            return {
              ...post,
              is_liked: !post.is_liked,
              likes_count: post.is_liked
                ? post.likes_count + 1
                : post.likes_count - 1,
            };
          }
          return post;
        });
      });
      Toast.show({
        type: "error",
        text1: i18n.t("like_failed_toast_title"),
        text2: i18n.t("could_not_like_post_toast_message"),
      });
    }
  };

  const addCommentToPost = async (postId: string) => {
    const commentText = newComment;
    setNewComment("");
    try {
      await addComment({ post: postId, text: commentText });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      // Scroll to bottom after adding comment
      setTimeout(() => {
        commentsListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      setNewComment(commentText);
      Toast.show({
        type: "error",
        text1: i18n.t("comment_failed_toast_title"),
        text2: i18n.t("could_not_add_comment_toast_message"),
      });
    }
  };

  const handleShare = async (post: any) => {
    try {
      const deepLink = `myapp://feed/${post.id}`;
      const webLink = `https://alphafeed.com/post/${post.id}`;
      const downloadLink = "https://alphafeed.com/download";
      const imageUrl = post.image?.replace("http://", "https://") || webLink;

      if (Platform.OS === "web") {
        // Web sharing logic
        const shareData: WebShareParams = {
          title: post.caption || i18n.t("check_out_this_post_share_title"),
          text: `${post.caption}\n\n${i18n.t("shared_via_app_text")}`,
          url: webLink,
        };

        if (navigator.share) {
          await navigator.share(shareData);
          await sharePost(post.id);
        } else if (navigator.clipboard) {
          await navigator.clipboard.writeText(`${shareData.text}\n${webLink}`);
          Toast.show({
            type: "success",
            text1: i18n.t("link_copied_toast_title"),
            text2: i18n.t("post_link_copied_toast_message"),
          });
          await sharePost(post.id);
        }
      } else {
        // Mobile sharing logic
        const shareOptions = {
          title: i18n.t("share_post_share_title"),
          message: `${post.caption}\n\n${i18n.t(
            "get_the_app_share_message"
          )}: ${downloadLink}`,
          url: imageUrl,
        };

        if (Platform.OS === "ios") {
          // iOS-specific share with fallback
          try {
            // Try native share first
            if (Platform.OS === "ios") {
              const { default: RNShare } = await import("react-native-share");
              const result = await RNShare.open(shareOptions);
              if (result) {
                await sharePost(post.id);
              }
            }
          } catch (error) {
            // Fallback to web browser on iOS if native share fails
            await WebBrowser.openBrowserAsync(webLink);
            await sharePost(post.id);
          }
        } else {
          // Android share
          const { default: RNShare } = await import("react-native-share");
          await RNShare.open(shareOptions);
          await sharePost(post.id);
        }
      }

      queryClient.invalidateQueries({ queryKey: ["posts"] });
    } catch (error: any) {
      if (!error.message.includes("User did not share")) {
        console.error(i18n.t("share_error_console_message"), error);
        Toast.show({
          type: "error",
          text1: i18n.t("share_failed_toast_title"),
          text2: i18n.t("could_not_share_post_toast_message"),
        });
      }
    }
  };

  const openCommentsModal = (post: any) => {
    setSelectedPost(post);
    setIsCommentsVisible(true);
    setNewComment(""); // Reset comment input when opening
  };

  const closeComments = () => {
    Animated.timing(overlayY, {
      toValue: screenHeight,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setIsCommentsVisible(false));
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.appbarContainer]}>
          <View style={styles.appbar}>
            <View style={styles.profileMenuItem}>
              <TouchableOpacity
                style={styles.profileMenuContent}
                onPress={() => {
                  router.push("/(protected)/profile");
                  // setVisible(false); // Removed as visible state is unused
                }}
                accessible
                accessibilityLabel={i18n.t("view_profile_accessibility_label")}
              >
                {/* Conditionally render ActivityIndicator while user image is loading */}
                {isUserLoading ? (
                  <ActivityIndicator
                    size="small"
                    color={theme.colors.primary}
                  />
                ) : user?.image ? (
                  <Avatar.Image
                    size={32}
                    source={{ uri: user.image?.replace("http://", "https://") }}
                  />
                ) : (
                  <Avatar.Image size={32} source={AvatarImage} />
                )}
              </TouchableOpacity>
            </View>
            <TextInput
              placeholder={i18n.t("search_posts_placeholder")}
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.searchInput}
              theme={{ roundness: 24, colors: { primary: "#EE8429" } }}
              underlineColor="transparent" // Removes Android's default underline
              activeUnderlineColor="transparent" // Removes Android's default underline
              cursorColor="#EE8429" // Sets the cursor color
            />
            <View style={styles.headerButtons}>
              <TouchableOpacity
                onPress={() => router.push("/(protected)/notification")}
                accessible
                accessibilityLabel={i18n.t(
                  "view_notifications_accessibility_label"
                )}
              >
                <View>
                  <NotificationIcon width={24} height={24} fill={"#2E18149E"} />
                  {notifications && notifications.unread_count > 0 && (
                    <Badge style={styles.badge}>
                      {notifications.unread_count > 99
                        ? "99+"
                        : notifications.unread_count}
                    </Badge>
                  )}
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={[styles.contentContainer]}>
          {isLoading ? ( // Show ActivityIndicator when posts are loading
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={styles.loadingText}>
                {i18n.t("loading_posts_text")}
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredPosts}
              style={{ backgroundColor: "#FDFDFC" }}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <View style={styles.postCard}>
                  <Card.Title
                    title={item.user}
                    subtitle={`${item.location} • ${friendlyTime(
                      item.time_ago
                    )} `}
                    left={() => (
                      <TouchableOpacity
                        onPress={() => {
                          router.push({
                            pathname: "/restaurant-profile",
                            params: { id: item.tenant_id },
                          });
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
                    source={{ uri: item.image?.replace("http://", "https://") }}
                    style={styles.postImage}
                    theme={{ roundness: 0 }}
                  />

                  <Card.Content style={styles.content}>
                    <View style={styles.postActions}>
                      {/* Like Button */}
                      <View style={styles.actionItem}>
                        <CustomIconButton
                          IconComponent={<LikeIcon width={22} height={22} />}
                          activeIcon={<LikedIcon width={22} height={22} />}
                          isActive={item.is_liked}
                          onPress={() => handleLike(item.id)}
                        />
                        <Text style={styles.actionText}>
                          {item.likes_count}
                        </Text>
                      </View>

                      {/* Comment Button */}
                      <View style={styles.actionItem}>
                        <CustomIconButton
                          IconComponent={<CommentIcon width={22} height={22} />}
                          onPress={() => openCommentsModal(item)}
                        />
                        <Text style={styles.actionText}>
                          {item.comments.length}
                        </Text>
                      </View>

                      {/* Share Button */}
                      <View style={styles.actionItem}>
                        <CustomIconButton
                          IconComponent={<ShareIcon width={22} height={22} />}
                          onPress={() => handleShare(item)}
                        />
                        <Text style={styles.actionText}>
                          {item.shares_count}
                        </Text>
                      </View>

                      <View style={styles.spacer} />

                      {/* Bookmark Button */}
                      <CustomIconButton
                        IconComponent={
                          <BookmarkIcon width={22} height={22} fill="#666" />
                        }
                        activeIcon={
                          <BookmarkedIcon width={22} height={22} fill="#666" />
                        }
                        isActive={item.is_bookmarked}
                        onPress={async () => {
                          await bookmarkPost(item.id);
                          queryClient.invalidateQueries({
                            queryKey: ["posts"],
                          });
                          refetch();
                        }}
                      />
                    </View>

                    <View style={styles.captionContainer}>
                      <Text style={styles.caption} numberOfLines={1}>
                        <Text style={styles.userName}>{item.user} </Text>
                        {item.caption}
                      </Text>
                      {item.caption.length > 50 && (
                        <TouchableOpacity
                          onPress={() => openCommentsModal(item)}
                        >
                          <Text style={styles.moreLink}>
                            {i18n.t("more_link")}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </Card.Content>
                </View>
              )}
              snapToInterval={screenHeight * 0.6}
              decelerationRate="fast"
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  colors={["#96B76E"]}
                  progressBackgroundColor="#ffffff"
                />
              }
              contentContainerStyle={styles.listContentContainer}
            />
          )}
        </View>

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
                  {i18n.t("comments_modal_title")}
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
                          item?.user?.image?.replace("http://", "https://") ||
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
                    {i18n.t("no_comments_text")}
                  </Text>
                }
                scrollEventThrottle={16}
                scrollEnabled={true}
                nestedScrollEnabled={true}
              />

              <View style={styles.modalCommentInputContainer}>
                <Avatar.Image
                  size={32}
                  source={{
                    uri:
                      user?.image?.replace("http://", "https://") ||
                      `https://api.dicebear.com/7.x/initials/svg?seed=You`,
                  }}
                  style={styles.inputAvatar}
                />
                <TextInput
                  mode="flat"
                  placeholder={i18n.t("add_comment_placeholder")}
                  value={newComment}
                  onChangeText={(text) =>
                    setNewComment(text.replace(/\s+/g, " ").trim())
                  }
                  style={styles.commentInput}
                  dense
                  underlineColor="transparent"
                  activeUnderlineColor="transparent"
                  cursorColor="#96B76E"
                  theme={{
                    colors: { primary: "#96B76E", placeholder: "#666" },
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
                      color: newComment.trim() ? "#6200ee" : "#ccc",
                    },
                  ]}
                >
                  {i18n.t("post_comment_button")}
                </Button>
              </View>
            </Animated.View>
          </View>
        )}
      </SafeAreaView>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FDFDFC",
  },
  safeArea: {
    backgroundColor: "#FDFDFC",
    flex: 1,
  },
  appbarContainer: {
    ...Platform.select({
      web: {
        maxWidth: 800,
        width: "100%",
        alignSelf: "center",
      },
    }),
  },
  appbar: {
    backgroundColor: "#FDFFFA",
    // elevation: 2, // Commented out as it's not present in the original code
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    // shadowOpacity: 0.1, // Commented out
    // shadowRadius: 4, // Commented out
    // shadowOffset: { width: 0, height: 2 }, // Commented out
    zIndex: 999,
    paddingVertical: 8,
    paddingRight: 16,
  },
  contentContainer: {
    backgroundColor: "#FDFDFC",
    flex: 1,
    ...Platform.select({
      web: {
        maxWidth: 800,
        width: "100%",
        alignSelf: "center",
      },
    }),
  },
  listContentContainer: {
    flexGrow: 1,
    ...Platform.select({
      web: {
        minHeight: "100%",
      },
    }),
  },
  postCard: {
    // marginVertical: 8, // Commented out
    marginHorizontal: Platform.OS === "web" ? 20 : 12,
    // borderRadius: 12, // Commented out
    backgroundColor: "#FDFFFA",
    overflow: "hidden",
    borderBottomWidth: 1,
    borderColor: "#E0E0E0",
    ...Platform.select({
      web: {
        // boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        maxWidth: 800,
        width: "90%",
        alignSelf: "center",
      },
      default: {
        height: screenHeight * 0.6,
      },
    }),
  },
  avatar: {
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    backgroundColor: "#f0f0f0",
  },
  postImage: {
    height: screenHeight * 0.36,
    width: "100%",
    borderRadius: 8,
  },
  content: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    paddingBottom: 24,
  },
  postActions: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  actionItem: {
    flexDirection: "row",
    alignItems: "center",
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
    fontWeight: "700",
    color: "#22281B",
  },
  captionContainer: {
    position: "relative",
    top: 0,
    textOverflow: "ellipsis",
  },
  caption: {
    fontSize: 15,
    lineHeight: 20,
    color: "#22281B",
    textOverflow: "ellipsis",
    fontWeight: "500",
  },
  userName: {
    fontWeight: "600",
    fontSize: 14,
    color: "#000",
  },
  subtitle: {
    fontSize: 12,
    color: "#757575",
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingBottom: 8,
  },
  tag: {
    color: "#6200ee",
    marginRight: 8,
    fontSize: 14,
  },
  overlayContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "flex-end",
    zIndex: 1000,
  },
  backdrop: {
    flex: 1,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  menuContent: {
    backgroundColor: "#ffffff",
    borderRadius: 8,
    paddingVertical: 8,
    // ...Platform.select({
    //   web: {
    //     boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    //   },
    // }),
  },
  profileMenuItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  profileMenuContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  profileMenuText: {
    fontSize: 14,
    color: "#333",
  },
  dragHandleContainer: {
    alignItems: "center",
    paddingVertical: 8,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#ddd",
    borderRadius: 2,
  },
  commentsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  commentsTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 18,
    color: "#666",
  },
  commentsPanel: {
    backgroundColor: "#ffffff",
    height: screenHeight * 0.8,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 16,
    overflow: "hidden",
    // ...Platform.select({
    //   web: {
    //     maxWidth: 600,
    //     width: "100%",
    //     alignSelf: "center",
    //     boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    //   },
    // }),
  },
  commentsListContainer: {
    flex: 1,
  },
  commentsContentContainer: {
    paddingBottom: 16,
    paddingTop: 8,
  },
  commentItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 12,
    marginBottom: 8,
  },
  fullCaptionContainer: {
    flexDirection: "row",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  captionAvatar: {
    marginRight: 12,
    backgroundColor: "#f0f0f0",
  },
  captionTextContainer: {
    flex: 1,
  },
  fullCaption: {
    fontSize: 14,
    lineHeight: 20,
    color: "#333",
  },
  captionTime: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  commentAvatar: {
    marginRight: 12,
    backgroundColor: "#f0f0f0",
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  headerButtons: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  commentUser: {
    fontWeight: "600",
    marginRight: 8,
    fontSize: 14,
    color: "#333",
  },
  commentTime: {
    fontSize: 12,
    color: "#666",
  },
  commentText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#333",
  },
  notificationIcon: {
    backgroundColor: "#f5f5f5",
  },
  badge: {
    position: "absolute",
    top: -5,
    right: -5,
    zIndex: 1,
    backgroundColor: "#ff4040",
    borderRadius: 10,
    minWidth: 18,
    minHeight: 18,
    justifyContent: "center",
    alignItems: "center",
    color: "#ffffff",
    fontSize: 10,
  },
  modalCommentInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  inputAvatar: {
    marginRight: 12,
    backgroundColor: "#f0f0f0",
  },
  commentInput: {
    flex: 1,
    height: 40,
    backgroundColor: "#f5f5f5",
    borderRadius: 20,
    paddingHorizontal: 20,
  },
  postButton: {
    fontWeight: "600",
    marginLeft: 8,
    fontSize: 14,
  },
  noCommentsText: {
    textAlign: "center",
    color: "#666",
    paddingVertical: 24,
    fontSize: 14,
  },
  searchInput: {
    flex: 1,
    marginRight: 16,
    backgroundColor: "#f5f5f5",
    fontFamily: "Outfit",
    borderRadius: 24,
  },
  moreLink: {
    color: "#96B76E",
    marginTop: 4,
    alignSelf: "flex-end",
    fontSize: 14,
  },
  menuOverlay: {
    position: Platform.OS === "web" ? "fixed" : "absolute",
    top: 0,
    left: 0,
    right: Platform.OS === "web" ? 310 : 0,
    bottom: 0,
    justifyContent: "flex-start",
    alignItems: "flex-end",
    zIndex: 1000,
  },
  customMenu: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    // marginTop: 60,
    marginRight: 10,
    paddingVertical: 8,
    paddingHorizontal: 0,
    width: 200,
    // shadowColor: "#000",
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.2,
    // shadowRadius: 8,
    // elevation: 5,
    zIndex: 1000,
  },
  menuItemText: {
    fontSize: 16,
    color: "#333333",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  // New styles for ActivityIndicator
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
  },
  loadingText: {
    marginTop: 10,
    color: "#666",
    fontSize: 16,
  },
});

export default FoodFeedScreen;
