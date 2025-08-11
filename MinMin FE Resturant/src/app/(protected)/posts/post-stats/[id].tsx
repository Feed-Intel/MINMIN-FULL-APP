import {
  View,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  useWindowDimensions,
  Dimensions,
} from "react-native";
import {
  Appbar,
  Avatar,
  Text,
  IconButton,
  useTheme,
  Divider,
  List,
  Card,
} from "react-native-paper";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useGetPostsStats } from "@/services/mutation/feedMutations";
import { useState } from "react";
import { ScrollView } from "react-native";

const { width: screenWidth } = Dimensions.get("window");

interface UserStat {
  id: string;
  full_name: string;
  image: string;
  email: string;
}

interface CommentStat {
  id: string;
  user: UserStat;
  text: string;
  created_at: string;
}

interface ShareStat {
  id: string;
  user: UserStat | null;
  shared_at: string;
}

interface PostStats {
  likes: {
    count: number;
    users: UserStat[];
  };
  shares: {
    count: number;
    items: ShareStat[];
  };
  comments: {
    count: number;
    items: CommentStat[];
  };
  bookmarks: {
    count: number;
    users: UserStat[];
  };
}

const PostStatistics = () => {
  const { width } = useWindowDimensions();
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const postId = Array.isArray(id) ? id[0] : id;
  const [expandedSections, setExpandedSections] = useState({
    likes: true,
    comments: true,
    shares: true,
    bookmarks: true,
  });

  // Responsive breakpoints
  const isSmallScreen = width < 768;
  const isMediumScreen = width >= 768 && width < 1024;
  const isLargeScreen = width >= 1024;

  const { data: postStats, isLoading, error } = useGetPostsStats(postId);
  console.log("Post Stats", postStats);
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const renderSection = (
    sectionKey: keyof typeof expandedSections,
    title: string,
    count: number,
    icon: string,
    data: any[],
    renderItem: ({ item }: { item: any }) => JSX.Element
  ) => {
    const isExpanded = expandedSections[sectionKey];
    const hasData = data.length > 0;

    return (
      <Card
        style={[
          styles.section,
          {
            backgroundColor: theme.colors.surface,
            borderRadius: isSmallScreen ? 8 : 12,
          },
        ]}
      >
        <Card.Title
          title={`${title} (${count})`}
          titleVariant={isSmallScreen ? "titleSmall" : "titleMedium"}
          titleStyle={{
            color: theme.colors.onSurface,
            fontSize: isSmallScreen ? 14 : 16,
          }}
          left={(props) => (
            <List.Icon
              {...props}
              icon={icon}
              color={theme.colors.primary}
            />
          )}
          right={(props) => (
            <IconButton
              icon={isExpanded ? "chevron-up" : "chevron-down"}
              size={isSmallScreen ? 18 : 20}
              onPress={() => toggleSection(sectionKey)}
            />
          )}
        />
        {isExpanded && (
          <>
            <Divider />
            {!hasData ? (
              <Text
                style={[
                  styles.emptyText,
                  {
                    color: theme.colors.onSurfaceVariant,
                    fontSize: isSmallScreen ? 12 : 14,
                  },
                ]}
                variant="bodyMedium"
              >
                No {title.toLowerCase()} yet
              </Text>
            ) : (
              <FlatList
                data={data}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                scrollEnabled={false}
                ListHeaderComponent={<View style={styles.listHeader} />}
                ListFooterComponent={<View style={styles.listFooter} />}
              />
            )}
          </>
        )}
      </Card>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size={isSmallScreen ? "large" : "small"} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text
          variant="titleMedium"
          style={{
            color: theme.colors.error,
            fontSize: isSmallScreen ? 14 : 16,
          }}
        >
          Error loading statistics: {(error as Error).message}
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Appbar.Header
        style={[
          styles.header,
          {
            backgroundColor: theme.colors.surface,
            height: isSmallScreen ? 56 : 64,
          },
        ]}
      >
        <Appbar.BackAction
          size={isSmallScreen ? 20 : 24}
          onPress={() => router.back()}
        />
        <Appbar.Content
          title="Post Analytics"
          titleStyle={[
            styles.headerTitle,
            {
              color: theme.colors.onSurface,
              fontSize: isSmallScreen ? 18 : 20,
            },
          ]}
        />
      </Appbar.Header>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            padding: isSmallScreen ? 12 : 16,
            gap: isSmallScreen ? 12 : 16,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {renderSection(
          "likes",
          "Likes",
          postStats?.likes.count || 0,
          "heart",
          postStats?.likes.users || [],
          ({ item }) => (
            <List.Item
              title={item.full_name}
              description={`@${item.email.split("@")[0]}`}
              left={() => (
                <Avatar.Image
                  source={{ uri: item.image }}
                  size={isSmallScreen ? 40 : 48}
                  style={styles.avatar}
                />
              )}
              titleStyle={{
                color: theme.colors.onSurface,
                fontSize: isSmallScreen ? 14 : 16,
              }}
              descriptionStyle={{
                color: theme.colors.onSurfaceVariant,
                fontSize: isSmallScreen ? 12 : 14,
              }}
            />
          )
        )}

        {renderSection(
          "comments",
          "Comments",
          postStats?.comments.count || 0,
          "comment",
          postStats?.comments.items || [],
          ({ item }) => (
            <List.Item
              title={item.user.full_name}
              description={item.text}
              left={() => (
                <Avatar.Image
                  source={{ uri: item.user.image }}
                  size={isSmallScreen ? 40 : 48}
                  style={styles.avatar}
                />
              )}
              right={() => (
                <Text
                  style={[
                    styles.timestamp,
                    {
                      color: theme.colors.onSurfaceVariant,
                      fontSize: isSmallScreen ? 10 : 12,
                    },
                  ]}
                >
                  {new Date(item.created_at).toLocaleString()} ago
                </Text>
              )}
              titleStyle={{
                color: theme.colors.onSurface,
                fontSize: isSmallScreen ? 14 : 16,
              }}
              descriptionStyle={{
                color: theme.colors.onSurfaceVariant,
                fontSize: isSmallScreen ? 12 : 14,
              }}
            />
          )
        )}

        {renderSection(
          "shares",
          "Shares",
          postStats?.shares.count || 0,
          "share",
          postStats?.shares.items || [],
          ({ item }) => (
            <List.Item
              title={item.user ? item.user.full_name : "Anonymous"}
              description={`Shared ${new Date(item.shared_at)} ago`}
              left={() => (
                <Avatar.Image
                  source={{
                    uri:
                      item.user?.image || "https://www.gravatar.com/avatar/000",
                  }}
                  size={isSmallScreen ? 40 : 48}
                  style={styles.avatar}
                />
              )}
              titleStyle={{
                color: theme.colors.onSurface,
                fontSize: isSmallScreen ? 14 : 16,
              }}
              descriptionStyle={{
                color: theme.colors.onSurfaceVariant,
                fontSize: isSmallScreen ? 12 : 14,
              }}
            />
          )
        )}

        {renderSection(
          "bookmarks",
          "Bookmarks",
          postStats?.bookmarks.count || 0,
          "bookmark",
          postStats?.bookmarks.users || [],
          ({ item }) => (
            <List.Item
              title={item.full_name}
              description={`@${item.email.split("@")[0]}`}
              left={() => (
                <Avatar.Image
                  source={{ uri: item.image }}
                  size={isSmallScreen ? 40 : 48}
                  style={styles.avatar}
                />
              )}
              titleStyle={{
                color: theme.colors.onSurface,
                fontSize: isSmallScreen ? 14 : 16,
              }}
              descriptionStyle={{
                color: theme.colors.onSurfaceVariant,
                fontSize: isSmallScreen ? 12 : 14,
              }}
            />
          )
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    elevation: 2,
  },
  headerTitle: {
    fontWeight: "600",
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  section: {
    overflow: "hidden",
  },
  avatar: {
    marginRight: 12,
  },
  timestamp: {
    alignSelf: "center",
  },
  emptyText: {
    textAlign: "center",
    marginVertical: 16,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  listHeader: {
    height: 8,
  },
  listFooter: {
    height: 8,
  },
});

export default PostStatistics;
