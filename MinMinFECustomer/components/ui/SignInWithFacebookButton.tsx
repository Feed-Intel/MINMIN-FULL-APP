import { Pressable, View, Image } from "react-native";
import { ThemedText } from "./ThemedText";

export default function SignInWithFacebookButton({
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
          backgroundColor: "#3A63ED",
          borderWidth: 1,
          borderColor: "#ccc",
        }}
      >
        <Image
          source={require("@/assets/images/facebook-icon.png")}
          style={{
            width: 18,
            height: 18,
            marginRight: 6,
          }}
        />
        <ThemedText type="defaultSemiBold" lightColor="#fff">
          Continue with Facebook
        </ThemedText>
      </View>
    </Pressable>
  );
}
