import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "../app/components/backgroundLocation";
import { ThemeProvider } from "./contexts/ThemeContext";


export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
            animationDuration: 400,
            contentStyle: { backgroundColor: '#fff' }
          }}
        >
          <Stack.Screen name="screens/apply_leave" options={{ animation: 'slide_from_bottom' }} />
          <Stack.Screen name="screens/add_designation" options={{ animation: 'slide_from_bottom' }} />
          <Stack.Screen name="screens/add_holiday" options={{ animation: 'slide_from_bottom' }} />
          <Stack.Screen name="screens/add_leave_type" options={{ animation: 'slide_from_bottom' }} />
          <Stack.Screen name="screens/create_job" options={{ animation: 'slide_from_bottom' }} />
          <Stack.Screen name="screens/forgot_password" options={{ animation: 'slide_from_bottom' }} />
        </Stack>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}


