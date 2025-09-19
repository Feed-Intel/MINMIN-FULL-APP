import React from 'react';
import { Pressable, Text } from 'react-native';

interface ButtonProps {
  title: string;
  onPress?: () => void;
  tone?: 'primary' | 'accent';
}

export function Button({ title, onPress, tone = 'primary' }: ButtonProps) {
  const background = tone === 'primary' ? '#73b661' : '#ffb72b';
  const textColor = '#ffffff';

  return (
    <Pressable
      onPress={onPress}
      className="h-12 px-5 rounded-2xl items-center justify-center"
      style={{ backgroundColor: background }}
    >
      <Text className="font-medium" style={{ color: textColor }}>
        {title}
      </Text>
    </Pressable>
  );
}
