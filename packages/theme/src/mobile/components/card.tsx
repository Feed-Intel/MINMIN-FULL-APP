import React from 'react';
import { View, ViewStyle } from 'react-native';

interface CardProps {
  style?: ViewStyle;
  children: React.ReactNode;
}

export function Card({ children, style }: CardProps) {
  return (
    <View
      className="bg-surface rounded-2xl p-4"
      style={[
        {
          shadowColor: '#000',
          shadowOpacity: 0.08,
          shadowOffset: { width: 0, height: 6 },
          shadowRadius: 10,
          elevation: 4,
          backgroundColor: '#ffffff',
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
