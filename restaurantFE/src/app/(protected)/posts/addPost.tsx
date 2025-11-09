import { useState } from 'react';
import {
  StyleSheet,
  Image,
  ScrollView,
  View,
  useWindowDimensions,
} from 'react-native';
import { Button, Card, TextInput, Text, Chip } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { useAddPost } from '@/services/mutation/feedMutations';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { base64ToBlob } from '@/util/imageUtils';

const AddPost = () => {
  const { width } = useWindowDimensions();
  const [image, setImage] = useState<{
    uri: string;
    name: string;
    type: string;
  } | null>(null);
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState('');
  const queryClient = useQueryClient();

  // Screen size breakpoints
  const isSmallScreen = width < 768;

  const handleAddTag = () => {
    if (currentTag.trim() && !tags.includes(currentTag.trim())) {
      setTags([...tags, currentTag.trim()]);
      setCurrentTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const { mutate: addPost, isPending } = useAddPost();

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
    }
  };

  const handleSubmit = async () => {
    if (!image || !caption || !location) {
      alert('Please fill in all fields and upload an image.');
      return;
    }

    const formData = new FormData();
    formData.append('caption', caption);
    formData.append('location', location);
    formData.append('tags', JSON.stringify(tags));
    const base64Data = image.uri;
    const contentType = image.type;
    const imageName = Date.now() + '.' + image.name?.split('.')[1];

    const blob = base64ToBlob(base64Data, contentType);
    formData.append(
      'image',
      new File([blob], imageName, { type: contentType })
    );

    try {
      await addPost(formData);
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      router.back();
    } catch (error) {
      console.error('Error adding post:', error);
    }
  };

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
            Add Post
          </Text>

          <Button
            mode="contained"
            onPress={pickImage}
            style={[styles.button, { marginBottom: isSmallScreen ? 8 : 16 }]}
            labelStyle={{ fontSize: isSmallScreen ? 14 : 16 }}
          >
            {image ? 'Change Image' : 'Upload Image'}
          </Button>

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
            onChangeText={setCaption}
            style={[styles.input, { marginBottom: isSmallScreen ? 12 : 16 }]}
            mode="outlined"
            multiline
            numberOfLines={3}
          />

          <TextInput
            label="Location"
            value={location}
            onChangeText={setLocation}
            style={[styles.input, { marginBottom: isSmallScreen ? 12 : 16 }]}
            mode="outlined"
          />

          <View style={styles.tagSection}>
            <ScrollView
              horizontal={!isSmallScreen}
              contentContainerStyle={[
                styles.chipContainer,
                { paddingBottom: isSmallScreen ? 8 : 12 },
              ]}
            >
              {tags?.map((tag, index) => (
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
            Submit Post
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  container: {
    alignSelf: 'center',
    marginVertical: 16,
  },
  title: {
    textAlign: 'center',
    fontWeight: '600',
  },
  input: {
    // backgroundColor: "white",
  },
  button: {
    borderRadius: 8,
  },
  image: {
    width: '100%',
    marginVertical: 16,
    resizeMode: 'cover',
  },
  tagSection: {
    marginVertical: 8,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  chip: {
    marginBottom: 8,
  },
});

export default AddPost;
