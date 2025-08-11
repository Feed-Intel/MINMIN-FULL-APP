import { useState } from "react";
import { Provider } from "react-redux";
import { AppStore, makeStore } from "./store";

export default function ReduxStoreProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [store] = useState<AppStore>(makeStore());

  return <Provider store={store}>{children}</Provider>;
}
