import { RootState } from "@/lib/reduxStore/store";
import { ActivityIndicator, Modal, Portal } from "react-native-paper";
import { useSelector } from "react-redux";

const Loader = () => {
  const isLoading = useSelector((state: RootState) => state.loader.isLoading);

  return (
    <Portal>
      <Modal visible={isLoading} dismissable={false}>
        <ActivityIndicator
          size="large"
          animating={true}
          style={{ flex: 1 }}
          color="#91B275"
        />
      </Modal>
    </Portal>
  );
};

export default Loader;
