import { useLocalSearchParams, router } from "expo-router";
import React, { useState, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ActivityIndicator, Appbar } from "react-native-paper";
import { WebView } from "react-native-webview";

const CompanyWebView = () => {
  const { title, url } = useLocalSearchParams();
  const [webViewKey, setWebViewKey] = useState(Date.now());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return () => {
      setWebViewKey((prevKey) => prevKey + 1);
    };
  }, []);

  const handleBack = () => {
    router.replace("/(protected)/profile");
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* App Header */}
      <Appbar.Header>
        <Appbar.BackAction onPress={handleBack} />
        <Appbar.Content title={title as string} />
      </Appbar.Header>

      {/* WebView or iframe */}
      <View style={styles.webViewContainer}>
        <WebView
          key={webViewKey}
          source={{ uri: url as string }}
          onLoad={() => setLoading(false)}
        />
        {loading && (
          <View style={styles.loaderContainer}>
            <ActivityIndicator animating={true} size="large" color="#96B76E" />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webViewContainer: {
    flex: 1,
  },
  loaderContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.7)",
  },
});

export default CompanyWebView;
