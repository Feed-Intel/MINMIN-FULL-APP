import { useState, useEffect } from 'react';
import {
  StyleSheet,
  Image,
  ScrollView,
  View,
  useWindowDimensions,
} from 'react-native';
import {
  Button,
  Card,
  TextInput,
  Text,
  Chip,
  ActivityIndicator,
} from 'react-native-paper';
import { useLocalSearchParams, router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import {
  useGetPostById,
  useUpdatePost,
} from '@/services/mutation/feedMutations';
import { useQueryClient } from '@tanstack/react-query';
import { base64ToBlob } from '@/util/imageUtils';

const EditPost = () => {
  const { width } = useWindowDimensions();
  const { postId } = useLocalSearchParams();
  const [image, setImage] = useState<{
    uri: string;
    name?: string;
    type?: string;
  } | null>(null);
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState('');

  // Validation state
  const [captionError, setCaptionError] = useState(false);
  const [locationError, setLocationError] = useState(false);
  const [imageError, setImageError] = useState(false);

  const isSmallScreen = width < 768;

  const { data: postData } = useGetPostById(postId as string);
  const { mutate: updatePost, isPending } = useUpdatePost(postId as string);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (postData) {
      setImage({ uri: postData.image });
      setCaption(postData.caption);
      setLocation(postData.location);

      let tagsArray: string[] = [];
      try {
        if (Array.isArray(postData.tags)) {
          tagsArray = postData.tags;
        } else if (typeof postData.tags === 'string') {
          try {
            tagsArray = JSON.parse(postData.tags);
            if (!Array.isArray(tagsArray)) {
              tagsArray = postData.tags
                .split(',')
                .map((tag: string) => tag.trim());
            }
          } catch {
            tagsArray = postData.tags
              .split(',')
              .map((tag: string) => tag.trim());
          }
        }
        setTags(tagsArray.filter(Boolean));
      } catch (error) {
        console.error('Error parsing tags:', error);
        setTags([]);
      }
    }
  }, [postData]);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage({
        uri: result.assets[0].uri,
        name: result.assets[0].fileName || 'image.jpg',
        type: result.assets[0].type || 'image/jpeg',
      });
      setImageError(false); // reset error
    }
  };

  const handleAddTag = () => {
    if (currentTag.trim() && !tags.includes(currentTag.trim())) {
      setTags([...tags, currentTag.trim()]);
      setCurrentTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleSubmit = async () => {
    // Reset errors
    setCaptionError(false);
    setLocationError(false);
    setImageError(false);

    let hasError = false;
    if (!image) {
      setImageError(true);
      hasError = true;
    }
    if (!caption.trim()) {
      setCaptionError(true);
      hasError = true;
    }
    if (!location.trim()) {
      setLocationError(true);
      hasError = true;
    }

    if (hasError) return;

    const formData = new FormData();
    formData.append('caption', caption);
    formData.append('location', location);
    formData.append('tags', tags.join(','));

    if (image?.uri !== postData?.image) {
      const base64Data = image!.uri;
      const contentType = image!.type!;
      const imageName = Date.now() + '.' + image!.name?.split('.')[1];
      const blob = base64ToBlob(base64Data, contentType);
      formData.append(
        'image',
        new File([blob], imageName, { type: contentType })
      );
    }

    try {
      await updatePost(formData);
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      router.back();
    } catch (error) {
      console.error('Error updating post:', error);
    }
  };

  if (!postData) {
    return (
      <ActivityIndicator
        size={isSmallScreen ? 'large' : 'small'}
        style={styles.loader}
      />
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <Card
        style={[
          styles.container,
          {
            width: isSmallScreen ? '95%' : '80%',
            maxWidth: 600,
            padding: isSmallScreen ? 12 : 24,
          },
        ]}
      >
        <Card.Content>
          <Text
            variant={isSmallScreen ? 'headlineSmall' : 'headlineMedium'}
            style={[styles.title, { marginBottom: isSmallScreen ? 12 : 16 }]}
          >
            Edit Post
          </Text>

          <Button
            mode="contained"
            onPress={pickImage}
            style={[styles.button, { marginBottom: isSmallScreen ? 8 : 16 }]}
            labelStyle={{ fontSize: isSmallScreen ? 14 : 16 }}
          >
            {image ? 'Change Image' : 'Upload Image'}
          </Button>
          {imageError && (
            <Text style={{ color: 'red', marginBottom: 8 }}>
              Please upload an image.
            </Text>
          )}

          {image && (
            <Image
              source={{ uri: image.uri }}
              style={[
                styles.image,
                {
                  height: isSmallScreen ? width * 0.6 : width * 0.4,
                  borderRadius: isSmallScreen ? 8 : 12,
                },
              ]}
            />
          )}

          <TextInput
            label="Caption"
            value={caption}
            onChangeText={(text) => {
              setCaption(text);
              setCaptionError(false);
            }}
            style={[styles.input, { marginBottom: isSmallScreen ? 12 : 16 }]}
            mode="outlined"
            multiline
            numberOfLines={3}
            error={captionError}
          />
          {captionError && (
            <Text style={{ color: 'red', marginBottom: 8 }}>
              Caption is required.
            </Text>
          )}

          <TextInput
            label="Location"
            value={location}
            onChangeText={(text) => {
              setLocation(text);
              setLocationError(false);
            }}
            style={[styles.input, { marginBottom: isSmallScreen ? 12 : 16 }]}
            mode="outlined"
            error={locationError}
          />
          {locationError && (
            <Text style={{ color: 'red', marginBottom: 8 }}>
              Location is required.
            </Text>
          )}

          <View style={styles.tagSection}>
            <ScrollView
              horizontal={!isSmallScreen}
              contentContainerStyle={[
                styles.chipContainer,
                { paddingBottom: isSmallScreen ? 8 : 12 },
              ]}
            >
              {tags.map((tag, index) => (
                <Chip
                  key={index}
                  onClose={() => handleRemoveTag(tag)}
                  style={[styles.chip, { marginRight: isSmallScreen ? 4 : 8 }]}
                  textStyle={{ fontSize: isSmallScreen ? 12 : 14 }}
                >
                  {tag}
                </Chip>
              ))}
            </ScrollView>

            <TextInput
              label="Add Tags"
              value={currentTag}
              onChangeText={setCurrentTag}
              onSubmitEditing={handleAddTag}
              returnKeyType="done"
              style={[styles.input, { marginBottom: isSmallScreen ? 12 : 16 }]}
              mode="outlined"
            />
          </View>

          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={isPending}
            style={[styles.button, { marginTop: isSmallScreen ? 8 : 16 }]}
            labelStyle={{ fontSize: isSmallScreen ? 14 : 16 }}
            contentStyle={{ height: isSmallScreen ? 40 : 48 }}
          >
            Update Post
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: { flexGrow: 1, justifyContent: 'center' },
  container: { alignSelf: 'center', marginVertical: 16 },
  title: { textAlign: 'center', fontWeight: '600' },
  input: {},
  button: { borderRadius: 8 },
  image: { width: '100%', marginVertical: 16, resizeMode: 'cover' },
  tagSection: { marginVertical: 8 },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
  chip: { marginBottom: 8 },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },
});

export default EditPost;
