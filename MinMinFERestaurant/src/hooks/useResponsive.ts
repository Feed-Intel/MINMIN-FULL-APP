import { useWindowDimensions } from "react-native";

/**
 * Simple hook that exposes booleans for the current device width.
 * The breakpoints are aligned with common mobile and tablet widths
 * so components can adapt their styles for different screens.
 */
export const useResponsive = () => {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const isMobile = width < 768;
  return { isTablet, isMobile };
};
