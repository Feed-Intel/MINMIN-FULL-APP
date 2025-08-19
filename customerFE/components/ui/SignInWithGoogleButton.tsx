import { Pressable, View, Image } from "react-native";
import { ThemedText } from "./ThemedText";

export default function SignInWithGoogleButton({
  onPress,
  disabled,
  style,
}: {
  onPress: () => void;
  disabled?: boolean;
  style: any;
}) {
  return (
    <Pressable onPress={onPress} disabled={disabled}>
      <View
        style={{
          ...style,
          height: 44,
          borderRadius: 25,
          backgroundColor: "#fff",
          borderWidth: 1,
          borderColor: "#ccc",
        }}
      >
        <Image
          source={require("@/assets/images/google-icon.png")}
          style={{
            width: 18,
            height: 18,
            marginRight: 6,
          }}
        />
        <ThemedText type="defaultSemiBold" darkColor="#000">
          Continue with Google
        </ThemedText>
      </View>
    </Pressable>
  );
}
