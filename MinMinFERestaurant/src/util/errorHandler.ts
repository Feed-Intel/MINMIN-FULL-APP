import { AxiosError } from "axios";
import Toast from "react-native-toast-message";

export const errorHandler = (err: Error | AxiosError) => {
  if (err instanceof AxiosError && err?.response?.data) {
    const responseData = err.response.data;
    if (responseData.message) {
      Toast.show({
        type: "error",
        text1: JSON.stringify(responseData.message),
      });
      throw responseData.message;
    } else if (responseData.error) {
      Toast.show({
        type: "error",
        text1: JSON.stringify(responseData.error),
      });
      throw responseData.error;
    } else {
      Toast.show({
        type: "error",
        text1: "Network Error",
        text2: "Please check your internet connection",
      });
      throw "Network Error";
    }
  } else {
    Toast.show({
      type: "error",
      text1: "Network Error",
      text2: "Please check your internet connection",
    });
    throw err?.message || "Network Error";
  }
};
