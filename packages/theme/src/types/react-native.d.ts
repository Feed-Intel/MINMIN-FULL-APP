declare module 'react-native' {
  import * as React from 'react';
  export interface ViewStyle {
    [key: string]: unknown;
  }
  export interface ShadowStyleIOS {
    shadowColor?: string;
    shadowOffset?: { width: number; height: number };
    shadowOpacity?: number;
    shadowRadius?: number;
  }
  export interface TextStyle {
    [key: string]: unknown;
  }
  export interface ViewProps {
    children?: React.ReactNode;
    style?: ViewStyle | ViewStyle[];
    className?: string;
  }
  export interface PressableProps extends ViewProps {
    onPress?: () => void;
  }
  export interface TextProps {
    children?: React.ReactNode;
    style?: TextStyle | TextStyle[];
    className?: string;
  }
  export const View: React.ComponentType<ViewProps>;
  export const Pressable: React.ComponentType<PressableProps>;
  export const Text: React.ComponentType<TextProps>;
}
