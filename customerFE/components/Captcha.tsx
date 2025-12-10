import React, { useEffect, useRef } from 'react';
import { Platform, View } from 'react-native';
import { WebView } from 'react-native-webview';

export default function CrossPlatformCaptcha({
  siteKey,
  onVerify,
}: {
  siteKey: string;
  onVerify: (token: string) => void;
}) {
  const isWeb = Platform.OS === 'web';

  // ---------------------
  // WEB VERSION
  // ---------------------
  if (isWeb) {
    return (
      <div>
        <div
          className="cf-turnstile"
          data-sitekey={siteKey}
          data-callback={(token: string) => onVerify(token)}
        />
        <script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js"
          async
        ></script>
      </div>
    );
  }

  // ---------------------
  // MOBILE VERSION (WebView)
  // ---------------------
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async></script>
      </head>
      <body>
        <div class="cf-turnstile"
          data-sitekey="${siteKey}"
          data-callback="onSuccess"
          data-theme="light"
        ></div>

        <script>
          function onSuccess(token) {
            window.ReactNativeWebView.postMessage(token);
          }
        </script>
      </body>
    </html>
  `;

  return (
    <View style={{ height: 80 }}>
      <WebView
        originWhitelist={['*']}
        source={{ html }}
        onMessage={(e) => onVerify(e.nativeEvent.data)}
        style={{ backgroundColor: 'transparent' }}
      />
    </View>
  );
}
