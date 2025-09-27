// import React from 'react';
// import { NavigationContainer } from '@react-navigation/native';
// import { createStackNavigator } from '@react-navigation/stack';
// import AuthNavigator from './AuthNavigator';
// import TabNavigator from './TabNavigator';
// import { useAuth } from '../context/AuthContext';

// const Stack = createStackNavigator();

// export default function AppNavigator() {
//   const { isAuthenticated } = useAuth();

//   return (
//     <NavigationContainer>
//       <Stack.Navigator screenOptions={{ headerShown: false }}>
//         {isAuthenticated ? (
//           <Stack.Screen name="Main" component={TabNavigator} />
//         ) : (
//           <Stack.Screen name="Auth" component={AuthNavigator} />
//         )}
//       </Stack.Navigator>
//     </NavigationContainer>
//   );
// }