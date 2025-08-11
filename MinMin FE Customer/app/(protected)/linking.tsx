import { useEffect } from "react";
import { Linking } from "react-native";
import { router } from "expo-router";

const LinkingProvider = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    const handleDeepLink = (event: { url: string }) => {
      const url = event.url.replace(/.*?:\/\//g, "");
      const [path, id] = url.split("/");

      if (path === "post" && id) {
        router.push(`/(protected)/feed/${id}` as any);
      }
    };

    Linking.addEventListener("url", handleDeepLink);

    // Handle cold starts
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink({ url });
    });

    return () => {
      Linking.removeAllListeners("url");
    };
  }, []);

  return children;
};

export default LinkingProvider;
