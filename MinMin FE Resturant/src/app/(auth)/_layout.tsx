import { setRestaurant } from "@/lib/reduxStore/authSlice";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, Slot } from "expo-router"
import { jwtDecode, JwtPayload } from "jwt-decode";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
export default function AuthLayout() {
    const dispatch = useDispatch();
    async function checkAuth() {
        const refreshToken = await AsyncStorage.getItem("refreshToken");
        if (refreshToken) {
          const decodedToken = jwtDecode<JwtPayload>(refreshToken);
          if (Date.now() < Number(decodedToken.exp) * 1000) {
            router.replace("/(protected)/dashboard");
          }
    
          const decodedPayload = jwtDecode<
            {
              tenant: string;
              user_type: string;
              email: string;
              branch?: string;
            } & JwtPayload
          >(refreshToken);
    
          dispatch(
            setRestaurant({
              id: decodedPayload.tenant,
              user_type: decodedPayload.user_type,
              email: decodedPayload.email,
              branch: decodedPayload.branch,
            })
          );
        }
      }
    
      useEffect(() => {
        checkAuth();
      }, []);
    return (
        <>
            <Slot/>
        </>
    )
}