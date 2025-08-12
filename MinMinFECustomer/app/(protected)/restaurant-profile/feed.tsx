import React, { useEffect, useRef, useState } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
  TouchableOpacity,
  Platform,
} from "react-native";
import { Card, Avatar, Text, TextInput, Button } from "react-native-paper";
import {
  useAddBookMark,
  useAddComment,
  useLikePost,
  useSharePost,
} from "@/services/mutation/feedMutation";
import { friendlyTime } from "@/utils/friendlyTimeUtil";
import { useQueryClient } from "@tanstack/react-query";
import { useGetUser } from "@/services/mutation/authMutation";
import { router, useLocalSearchParams } from "expo-router";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useAuth } from "@/context/auth";
import { ThemedView } from "@/components/ThemedView";
import LikeIcon from "@/assets/icons/like.svg";
import LikedIcon from "@/assets/icons/liked.svg";
import CommentIcon from "@/assets/icons/comment.svg";
import ShareIcon from "@/assets/icons/share.svg";
import BookmarkIcon from "@/assets/icons/bookmark.svg";
import BookmarkedIcon from "@/assets/icons/bookmarked.svg";
import Toast from "react-native-toast-message";
import * as WebBrowser from "expo-web-browser";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { i18n } from "@/app/_layout";

const { height: screenHeight, width: screenWidth } = Dimensions.get("window");

// Define a constant for consistent horizontal padding
const horizontalPadding = 20; // Adjust this value as needed

type WebShareParams = {
  title?: string;
  text?: string;
  url: string;
};

const FoodFeedScreen = () => {
  const headerAnimation = useRef(new Animated.Value(0)).current;
  const contentAnimation = useRef(new Animated.Value(0)).current;
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState("");
  const { mutateAsync: likePost } = useLikePost();
  const { mutateAsync: addComment } = useAddComment();
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [isCommentsVisible, setIsCommentsVisible] = useState(false);
  const [showBookmarks, setShowBookmarks] = useState(false); // Unused variable
  const overlayY = useRef(new Animated.Value(screenHeight)).current;
  const { mutateAsync: bookmarkPost } = useAddBookMark();
  const [isListAtTop, setIsListAtTop] = useState(true); // Unused variable
  const commentsListRef = useRef<FlatList>(null);
  const { mutateAsync: sharePost } = useSharePost();
  const { user: userInfo } = useAuth();
  const { data: user, isLoading: isUserLoading } = useGetUser(
    userInfo?.id || userInfo?.user_id
  );

  const singlePost: any = useLocalSearchParams();
  const [isLiked, setIsLiked] = useState(
    (singlePost?.is_liked as unknown) || false
  );
  const [isBookmarked, setIsBookmarked] = useState(
    singlePost?.is_bookmarked || false
  );
  const [comments, setComments] = useState<[]>(
    JSON.parse(singlePost?.comments as any) || []
  );

  // For a single feed, we'll just take the first post if available

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
  }, [isCommentsVisible, overlayY]); // Added overlayY to dependency array

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

  const handleLike = async (postId: string) => {
    // Optimistic update for immediate UI feedback

    try {
      await likePost(postId);
      // Refetch to ensure data consistency
      setIsLiked(!isLiked);
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
        text1: i18n.t("like_failed_toast_title"), // i18n
        text2: i18n.t("could_not_like_post_toast_message"), // i18n
      });
    }
  };

  const addCommentToPost = async (postId: string) => {
    const commentText = newComment;
    setNewComment("");
    setComments(
      (prev) =>
        [
          ...prev,
          {
            id: postId,
            user: { full_name: userInfo?.full_name },
            text: commentText,
            created_at: Date.now().toString(),
          },
        ] as any
    );
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
        text1: i18n.t("comment_failed_toast_title"), // i18n
        text2: i18n.t("could_not_add_comment_toast_message"), // i18n
      });
    }
  };

  const handleShare = async (post: any) => {
    try {
      const webLink = `https://alphafeed.com/post/${post.id}`;
      const downloadLink = "https://alphafeed.com/download";
      const imageUrl = post.image?.replace("http://", "https://") || webLink;

      if (Platform.OS === "web") {
        // Web sharing logic
        const shareData: WebShareParams = {
          title: post.caption || i18n.t("check_out_this_post_share_title"), // i18n
          text: `${post.caption}\n\n${i18n.t("shared_via_app_text")}`, // i18n
          url: webLink,
        };

        if (navigator.share) {
          await navigator.share(shareData);
          await sharePost(post.id);
        } else if (navigator.clipboard) {
          await navigator.clipboard.writeText(`${shareData.text}\n${webLink}`);
          Toast.show({
            type: "success",
            text1: i18n.t("link_copied_toast_title"), // i18n
            text2: i18n.t("post_link_copied_toast_message"), // i18n
          });
          await sharePost(post.id);
        }
      } else {
        // Mobile sharing logic
        const shareOptions = {
          title: i18n.t("share_post_share_title"), // i18n
          message: `${post.caption}\n\n${i18n.t(
            "get_the_app_share_message"
          )}: ${downloadLink}`, // i18n
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
        console.error(i18n.t("share_error_console_message"), error); // i18n
        Toast.show({
          type: "error",
          text1: i18n.t("share_failed_toast_title"), // i18n
          text2: i18n.t("could_not_share_post_toast_message"), // i18n
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

  const handleScroll = (event: {
    nativeEvent: { contentOffset: { y: number } };
  }) => {
    const yOffset = event.nativeEvent.contentOffset.y;
    setIsListAtTop(yOffset <= 0);
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.appbarContainer]}>
          <View style={styles.appbar}>
            {/* Back Button */}
            <TouchableOpacity
              onPress={() =>
                router.replace({
                  pathname: "/(protected)/restaurant-profile",
                  params: { id: singlePost.tenant_id as string },
                })
              }
              style={styles.backButton}
              accessible
              accessibilityLabel={i18n.t("go_back_accessibility_label")} // i18n
            >
              <Ionicons name="arrow-back" size={24} color="#22281B" />
            </TouchableOpacity>
            {/* You can add a title here if needed */}
            <Text style={styles.screenTitle}>
              {i18n.t("post_details_title")}
            </Text>
          </View>
        </View>

        <View style={[styles.contentContainer]}>
          {singlePost ? ( // Render only the singlePost if available
            <View style={styles.singlePostWrapper}>
              <View style={styles.postCard}>
                <Card.Title
                  title={singlePost.user}
                  subtitle={`${singlePost.location} • ${friendlyTime(
                    singlePost.time_ago as any
                  )} `}
                  left={() => (
                    <TouchableOpacity
                      onPress={() => {
                        router.push({
                          pathname: "/restaurant-profile",
                          params: { id: singlePost.tenant_id },
                        });
                      }}
                    >
                      <Avatar.Image
                        size={44}
                        source={{
                          uri: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                            singlePost.user as string
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
                  source={{
                    uri: singlePost.image!.replace("http://", "https://"),
                  }}
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
                        isActive={isLiked as boolean}
                        onPress={() => handleLike(singlePost.id as string)}
                      />
                      <Text style={styles.actionText}>
                        {singlePost.likes_count}
                      </Text>
                    </View>

                    {/* Comment Button */}
                    <View style={styles.actionItem}>
                      <CustomIconButton
                        IconComponent={<CommentIcon width={22} height={22} />}
                        onPress={() => openCommentsModal(singlePost)}
                      />
                      <Text style={styles.actionText}>
                        {singlePost.comments.length}
                      </Text>
                    </View>

                    {/* Share Button */}
                    <View style={styles.actionItem}>
                      <CustomIconButton
                        IconComponent={<ShareIcon width={22} height={22} />}
                        onPress={() => handleShare(singlePost)}
                      />
                      <Text style={styles.actionText}>
                        {singlePost.shares_count}
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
                      isActive={isBookmarked as boolean}
                      onPress={async () => {
                        await bookmarkPost(singlePost.id as string);
                        setIsBookmarked(!isBookmarked);
                      }}
                    />
                  </View>

                  <View style={styles.captionContainer}>
                    <Text style={styles.caption} numberOfLines={1}>
                      <Text style={styles.userName}>{singlePost.user} </Text>
                      {singlePost.caption}
                    </Text>
                    {singlePost.caption.length > 50 && (
                      <TouchableOpacity
                        onPress={() => openCommentsModal(singlePost)}
                      >
                        <Text style={styles.moreLink}>
                          {i18n.t("more_link")}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </Card.Content>
              </View>
            </View>
          ) : (
            <View style={styles.noPostsContainer}>
              <Text style={styles.noPostsText}>
                {i18n.t("no_posts_found_text")}
              </Text>
            </View>
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
                  {i18n.t("comments_title")}
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
                data={comments}
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
                onScroll={handleScroll}
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
                  {i18n.t("post_button")}
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start", // Align to start for back button
    zIndex: 999,
    paddingVertical: 8,
    paddingHorizontal: horizontalPadding,
  },
  backButton: {
    marginRight: 10,
    padding: 5,
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#22281B",
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
  singlePostWrapper: {
    flex: 1,
    paddingHorizontal: horizontalPadding,
    paddingVertical: 8,
    justifyContent: "flex-start",
  },
  postCard: {
    backgroundColor: "#FDFFFA",
    overflow: "hidden",
    borderBottomWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    ...Platform.select({
      web: {
        maxWidth: 600,
        width: "100%",
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
    borderRadius: 0,
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
    paddingHorizontal: horizontalPadding,
    overflow: "hidden",
    ...Platform.select({
      web: {
        maxWidth: 600,
        width: "100%",
        alignSelf: "center",
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
    marginRight: 10,
    paddingVertical: 8,
    paddingHorizontal: 0,
    width: 200,
    zIndex: 1000,
  },
  menuItemText: {
    fontSize: 16,
    color: "#333333",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
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
  noPostsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
  },
  noPostsText: {
    fontSize: 16,
    color: "#666",
  },
});

export default FoodFeedScreen;
