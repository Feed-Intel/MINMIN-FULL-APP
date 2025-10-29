import { useGetPosts } from '@/services/mutation/feedMutations';
import * as React from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Card, Text } from 'react-native-paper';
import Pagination from './Pagination';
import { i18n as I18n } from '@/app/_layout';

export default function PostGallery({ onAddPost }: { onAddPost: () => void }) {
  const [currentPage, setCurrentPage] = React.useState<number>(1);
  const { data: posts } = useGetPosts(currentPage);

  return (
    <ScrollView
      contentContainerStyle={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        padding: 10,
      }}
    >
      {posts?.results.length == 0 && (
        <View
          style={{
            justifyContent: 'center',
            margin: 'auto',
            alignItems: 'center',
            gap: 15,
          }}
        >
          <Text
            style={{
              fontWeight: '500',
              fontSize: 30,
            }}
          >
            {I18n.t('postGallery.createFirstPost')}
          </Text>
          <Text>{I18n.t('postGallery.createFirstPostDescription')}</Text>
          <Button
            icon="plus"
            style={{
              backgroundColor: '#91B275',
              borderRadius: 20,
              paddingHorizontal: 16,
              alignSelf: 'center',
            }}
            labelStyle={{
              color: '#fff',
            }}
            onPress={onAddPost}
          >
            {I18n.t('postGallery.addPosts')}
          </Button>
        </View>
      )}

      {posts?.results.map((ps) => (
        <Card
          key={ps.id}
          mode="contained"
          style={{
            width: '32%',
            marginVertical: 8,
            backgroundColor: '#EFF4EB',
            borderRadius: 12,
            shadowColor: 'transparent',
          }}
        >
          <Card.Cover
            source={{ uri: ps.image }}
            style={{
              borderTopLeftRadius: 7,
              borderTopRightRadius: 7,
              backgroundColor: '#EFF4EB',
              marginBottom: 10,
            }}
          />
          <Card.Content>
            <Text variant="bodySmall" style={{ color: '#1B2128' }}>
              {ps.caption}
            </Text>
          </Card.Content>
        </Card>
      ))}

      <Pagination
        totalPages={Math.ceil((posts?.count || 0) / 10)}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
      />
    </ScrollView>
  );
}
