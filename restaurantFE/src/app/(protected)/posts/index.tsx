import { useState } from 'react';
import {
  FlatList,
  View,
  Image,
  StyleSheet,
  useWindowDimensions,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import {
  Card,
  Button,
  Text,
  Dialog,
  Portal,
  Paragraph,
  IconButton,
} from 'react-native-paper';
import { useRouter } from 'expo-router';
import {
  useAddPost,
  useDeletePost,
  useGetPosts,
} from '@/services/mutation/feedMutations';
import { useQueryClient } from '@tanstack/react-query';
import { useDispatch } from 'react-redux';
import { hideLoader, showLoader } from '@/lib/reduxStore/loaderSlice';

const AdminPosts = () => {
  const { width } = useWindowDimensions();
  const router = useRouter();
  const [showDialog, setShowDialog] = useState(false);
  const [postId, setPostId] = useState<string | null>(null);
  const [addPostModalVisible, setAddPostModalVisible] = useState(false);
  const { data: posts } = useGetPosts();
  const { mutate: deletePost } = useDeletePost();
  const queryClient = useQueryClient();
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState(1);

  const numColumns = 3; // Always 3 columns
  const cardWidth = (width - 48) / numColumns; // padding 16 * 2 + spacing

  const handleDeletePost = async () => {
    if (!postId) return;
    try {
      setShowDialog(false);
      setPostId(null);
      dispatch(showLoader());
      await deletePost(postId);
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      dispatch(hideLoader());
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Posts</Text>
        <Button
          mode="contained"
          icon="plus"
          onPress={() => setAddPostModalVisible(true)}
          style={styles.addButton}
          labelStyle={{ fontSize: 14, color: '#ffffff' }}
        >
          Add posts
        </Button>
      </View>

      {/* Post Grid */}
      <FlatList
        data={posts}
        numColumns={numColumns}
        key={numColumns}
        keyExtractor={(item) => item.id.toString()}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <Card style={[styles.postCard, { width: cardWidth }]} mode="outlined">
            <TouchableOpacity
              onPress={() => router.push(`/(protected)/posts/${item.id}`)}
              activeOpacity={0.85}
            >
              <Image
                source={{ uri: item.image }}
                style={styles.postImage}
                resizeMode="cover"
              />
              <Card.Content style={styles.cardContent}>
                <Text style={styles.postDescription} numberOfLines={2}>
                  {item.caption}
                </Text>
              </Card.Content>
            </TouchableOpacity>
            <View style={styles.actionRow}>
              <IconButton
                icon="pencil"
                size={18}
                onPress={() => router.push(`/(protected)/posts/${item.id}`)}
              />
              <IconButton
                icon="delete"
                size={18}
                onPress={() => {
                  setPostId(item.id);
                  setShowDialog(true);
                }}
              />
            </View>
          </Card>
        )}
      />

      {/* Pagination */}
      <View style={styles.pagination}>
        <Button
          compact
          mode="contained"
          style={activeTab === 1 ? styles.pageActive : styles.pageButton}
          onPress={() => setActiveTab(1)}
        >
          1
        </Button>
        {[2, 3, 4, 5].map((page) => (
          <Button
            key={page}
            compact
            style={activeTab === page ? styles.pageActive : styles.pageButton}
            labelStyle={{ color: '#14212E9E' }}
            onPress={() => setActiveTab(page)}
          >
            {page}
          </Button>
        ))}
        <IconButton
          icon="chevron-right"
          iconColor="#14212E9E"
          style={{ backgroundColor: '#fff', height: 40, width: 40 }}
        />
      </View>

      {/* Delete Confirmation Dialog */}
      <Portal>
        <Dialog visible={showDialog} onDismiss={() => setShowDialog(false)}>
          <Dialog.Title>Confirm Delete</Dialog.Title>
          <Dialog.Content>
            <Paragraph>
              Are you sure you want to delete this post? This action cannot be
              undone.
            </Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowDialog(false)}>Cancel</Button>
            <Button mode="contained" onPress={handleDeletePost}>
              Delete
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
      <AddPostModal
        visible={addPostModalVisible}
        onClose={() => setAddPostModalVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#EFF4EB' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#22281B' },
  addButton: {
    borderRadius: 20,
    backgroundColor: '#A4C58C',
    width: 131,
    alignSelf: 'flex-end',
  },
  listContent: { paddingBottom: 24 },
  row: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  postCard: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    height: 300,
  },
  postImage: {
    width: '100%',
    height: 250, // fixed height for equal-sized images
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  cardContent: {
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  postDescription: {
    fontSize: 13,
    color: '#666',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 4,
    paddingBottom: 8,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 4,
    marginTop: 12,
  },
  pageActive: {
    borderRadius: 12,
    backgroundColor: '#A4C58C',
    paddingHorizontal: 12,
  },
  pageButton: {
    borderRadius: 12,
    backgroundColor: 'transparent',
    paddingHorizontal: 12,
  },
});

export default AdminPosts;

import * as ImagePicker from 'expo-image-picker';
import { base64ToBlob } from '@/util/imageUtils';

interface Props {
  visible: boolean;
  onClose: () => void;
}

const AddPostModal: React.FC<Props> = ({ visible, onClose }) => {
  const [caption, setCaption] = useState('');
  const [imageUri, setImageUri] = useState<{
    uri: string;
    name: string;
    type: string;
  } | null>(null);
  const { mutate: addPost } = useAddPost();
  const queryClient = useQueryClient();

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImageUri({
        uri: result.assets[0].uri,
        name: result.assets[0].fileName || 'image.jpg',
        type: result.assets[0].type || 'image/jpeg',
      });
    }
  };

  const handleAddPost = async () => {
    // if (!imageUri || !caption) return;
    // addPost({ image: imageUri, caption, category });
    // setCaption("");
    // setImageUri(null);
    // onClose();
    if (!imageUri?.uri || !caption) {
      alert('Please fill in all fields and upload an image.');
      return;
    }

    const formData = new FormData();
    formData.append('caption', caption);
    formData.append('location', '');
    formData.append('tags', JSON.stringify([]));
    const base64Data = imageUri.uri;
    const contentType = imageUri.type;
    const imageName = Date.now() + '.' + imageUri.name?.split('.')[1];

    const blob = base64ToBlob(base64Data, contentType);
    formData.append(
      'image',
      new File([blob], imageName, { type: contentType })
    );

    try {
      await addPost(formData);
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    } catch (error) {
      console.error('Error adding post:', error);
    }
  };

  return (
    <Portal>
      <Dialog
        visible={visible}
        onDismiss={onClose}
        style={stylesModal.dialogContainer}
      >
        <Dialog.Content style={{ paddingHorizontal: 0 }}>
          {/* Upload Box */}
          <TouchableOpacity style={stylesModal.uploadBox} onPress={pickImage}>
            <Text style={stylesModal.uploadText}>
              {imageUri
                ? 'File Selected'
                : 'Choose a file or drag and drop here'}
            </Text>
            <Button
              mode="outlined"
              onPress={pickImage}
              style={stylesModal.browseBtn}
              labelStyle={{ color: '#000' }}
            >
              Browse a file
            </Button>
          </TouchableOpacity>

          {/* Caption */}
          <TextInput
            style={stylesModal.captionInput}
            placeholder="Caption"
            placeholderTextColor="#666"
            value={caption}
            onChangeText={setCaption}
          />

          {/* Add Post Button */}
          <Button
            mode="contained"
            onPress={handleAddPost}
            style={styles.addButton}
            labelStyle={{ color: '#fff', fontWeight: '600' }}
          >
            + Add Post
          </Button>
        </Dialog.Content>
      </Dialog>
    </Portal>
  );
};

const stylesModal = StyleSheet.create({
  dialogContainer: {
    backgroundColor: '#F3F7EC',
    borderRadius: 16,
    width: '40%',
    alignSelf: 'center',
    padding: 20,
  },
  uploadBox: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    backgroundColor: '#E7EFE2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  uploadText: {
    fontSize: 14,
    marginBottom: 8,
    color: '#333',
    textAlign: 'center',
    fontWeight: '700',
  },
  browseBtn: {
    borderColor: '#A4C58C',
  },
  dropdownPlaceholder: {
    width: '100%',
    height: 40,
    backgroundColor: '#E7EFE2',
    borderRadius: 8,
    justifyContent: 'center',
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  captionInput: {
    width: '100%',
    height: 60,
    backgroundColor: '#E7EFE2',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    marginBottom: 16,
  },
  addButton: {
    backgroundColor: '#A4C58C',
    borderRadius: 12,
    paddingHorizontal: 24,
    alignSelf: 'flex-end',
  },
});
