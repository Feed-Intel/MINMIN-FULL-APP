import { useAddPost } from '@/services/mutation/feedMutations';
import * as React from 'react';
import { View, StyleSheet, TextInput, Platform } from 'react-native';
import {
  Modal,
  Portal,
  Text,
  Button,
  TextInput as PaperTextInput,
} from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { base64ToBlob } from '@/util/imageUtils';
import {
  DropdownInputProps,
  MultiSelectDropdown,
  Option,
} from 'react-native-paper-dropdown';
import { i18n as I18n } from '@/app/_layout';

export default function AddPostModal({
  visible,
  onDismiss,
}: {
  visible: boolean;
  onDismiss: () => void;
}) {
  const [caption, setCaption] = React.useState('');
  const [location, setLocation] = React.useState('');
  const { mutate: addPost } = useAddPost();
  const [uploadedImage, setUploadedImage] = React.useState<any | undefined>(
    undefined
  );
  const [selectedTags, setSelectedTags] = React.useState<string[]>([]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });

    if (result.canceled || !result.assets?.length) {
      return;
    }
    const asset = result.assets[0];
    setUploadedImage(asset);
  };

  const onSubmit = async () => {
    const formData = new FormData();
    const mimeType =
      uploadedImage?.mimeType || uploadedImage.type || 'image/jpeg';
    const extension = mimeType.split('/')[1] || 'jpg';
    const fileName = uploadedImage.fileName || `profile.${extension}`;
    formData.append('caption', caption);
    formData.append('location', location);
    formData.append('tags', selectedTags.join(','));
    if (Platform.OS === 'web') {
      const blob = base64ToBlob(uploadedImage.uri, mimeType);
      formData.append('image', new File([blob], fileName, { type: mimeType }));
    } else {
      formData.append('image', {
        uri: uploadedImage.uri,
        name: fileName,
        type: mimeType,
      } as any);
    }
    await addPost(formData);
    onDismiss();
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={[
          styles.container,
          { backgroundColor: '#EBF1E6' },
        ]}
      >
        <View style={styles.uploadBox}>
          <View style={{ alignSelf: 'center', marginBottom: 10 }}>
            <Text
              style={{
                color: '#333',
                marginBottom: 6,
                fontWeight: '500',
                textAlign: 'center',
              }}
            >
              {uploadedImage
                ? I18n.t('addPostModal.fileUploaded')
                : I18n.t('addPostModal.chooseOrDrag')}
            </Text>
            <Button
              mode="outlined"
              textColor="#333"
              style={{ borderColor: '#6E504933', borderWidth: 1 }}
              onPress={pickImage}
            >
              {uploadedImage
                ? I18n.t('addPostModal.changeImage')
                : I18n.t('addPostModal.browseFile')}
            </Button>
          </View>

          <TextInput
            placeholder={I18n.t('addPostModal.captionPlaceholder')}
            value={caption}
            onChangeText={setCaption}
            style={[styles.captionInput, { backgroundColor: '#D9E4D4' }]}
            placeholderTextColor={'#202B1866'}
          />

          <TextInput
            placeholder={I18n.t('addPostModal.locationPlaceholder')}
            value={location}
            onChangeText={setLocation}
            style={[styles.captionInput, { backgroundColor: '#D9E4D4' }]}
            placeholderTextColor={'#202B1866'}
          />

          <MultiSelectDropdown
            label={I18n.t('addPostModal.selectTagsLabel')}
            placeholder={I18n.t('addPostModal.selectTagsPlaceholder')}
            options={
              [
                {
                  label: I18n.t('addPostModal.tags.breakfast'),
                  value: 'Breakfast',
                },
                { label: I18n.t('addPostModal.tags.lunch'), value: 'Lunch' },
                { label: I18n.t('addPostModal.tags.dinner'), value: 'Dinner' },
                {
                  label: I18n.t('addPostModal.tags.dessert'),
                  value: 'Dessert',
                },
              ] as Option[]
            }
            value={selectedTags}
            onSelect={(values) => setSelectedTags(values)}
            menuContentStyle={{
              backgroundColor: '#fff',
            }}
            CustomMenuHeader={() => <Text>{''}</Text>}
            CustomMultiSelectDropdownInput={({
              placeholder,
              selectedLabel,
              rightIcon,
            }: DropdownInputProps) => (
              <PaperTextInput
                mode="outlined"
                placeholder={placeholder}
                placeholderTextColor={'#202B1866'}
                value={selectedLabel}
                style={{
                  backgroundColor: '#50693A17',
                  maxHeight: 50,
                }}
                contentStyle={{
                  borderColor: '#ccc',
                  minWidth: 470,
                }}
                textColor={'#000'}
                right={rightIcon}
                outlineColor="#ccc"
              />
            )}
          />
        </View>

        <Button
          icon="plus"
          style={{
            backgroundColor: '#91B275',
            borderRadius: 20,
            paddingHorizontal: 16,
            alignSelf: 'flex-end',
          }}
          labelStyle={{
            color: '#fff',
          }}
          onPress={onSubmit}
        >
          {I18n.t('addPostModal.addPosts')}
        </Button>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 'auto',
    borderRadius: 12,
    padding: 20,
    width: 600,
    height: 400,
  },
  uploadBox: {
    height: 300,
    borderRadius: 12,
    backgroundColor: '#50693A17',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    marginVertical: 20,
  },
  captionInput: {
    borderRadius: 8,
    marginBottom: 15,
    width: '95%',
    borderWidth: 1.5,
    padding: 15,
  },
  addButton: {
    alignSelf: 'flex-end',
    borderRadius: 8,
  },
});
