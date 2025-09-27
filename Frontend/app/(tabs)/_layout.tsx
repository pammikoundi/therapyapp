import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Drawer } from 'expo-router/drawer';
import { View, Text, TouchableOpacity } from 'react-native';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { useRouter, usePathname } from 'expo-router';
import { DrawerActions } from '@react-navigation/native';

// Custom drawer content component
function CustomDrawerContent(props: any) {
  const router = useRouter();
  const pathname = usePathname();

  const menuItems = [
    { name: 'index', title: 'Chat', emoji: '💬', route: '/' },
    { name: 'history', title: 'History', emoji: '📚', route: '/history' },
    { name: 'statistics', title: 'Statistics', emoji: '📊', route: '/statistics' },
    { name: 'settings', title: 'Settings', emoji: '⚙️', route: '/settings' },
  ];

  return (
    <DrawerContentScrollView {...props} style={{ backgroundColor: '#FFFFFF' }}>
      {/* Header */}
      <View style={{
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
        marginBottom: 10,
      }}>
        <Text style={{
          fontSize: 24,
          fontWeight: 'bold',
          color: '#333333',
        }}>
          Alex Chat
        </Text>
        <Text style={{
          fontSize: 14,
          color: '#666666',
          marginTop: 4,
        }}>
          Your mental wellness companion
        </Text>
      </View>

      {/* Menu Items */}
      {menuItems.map((item) => {
        const isActive = pathname === item.route;
        return (
          <TouchableOpacity
            key={item.name}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 20,
              paddingVertical: 16,
              backgroundColor: isActive ? '#007AFF15' : 'transparent',
              borderRightWidth: isActive ? 3 : 0,
              borderRightColor: '#007AFF',
            }}
            onPress={() => {
              router.push(item.route as any);
              props.navigation.closeDrawer();
            }}
          >
            <Text style={{ 
              fontSize: 20, 
              marginRight: 12,
              opacity: isActive ? 1 : 0.6,
            }}>
              {item.emoji}
            </Text>
            <Text style={{
              fontSize: 16,
              color: isActive ? '#007AFF' : '#333333',
              fontWeight: isActive ? '600' : '400',
            }}>
              {item.title}
            </Text>
          </TouchableOpacity>
        );
      })}

      {/* Footer */}
      <View style={{
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
      }}>
        <Text style={{
          fontSize: 12,
          color: '#999999',
          textAlign: 'center',
        }}>
          Version 1.0.0
        </Text>
      </View>
    </DrawerContentScrollView>
  );
}

// Custom header with hamburger menu
function DrawerToggleButton() {
  const router = useRouter();
  
  const toggleDrawer = () => {
    // Use router to dispatch drawer toggle
    router.navigate('/' as any);
    // Alternative approach - we'll handle this differently
  };

  return (
    <TouchableOpacity
      style={{
        paddingHorizontal: 16,
        paddingVertical: 8,
      }}
      onPress={toggleDrawer}
    >
      <View>
        <View style={{
          width: 20,
          height: 2,
          backgroundColor: '#333333',
          marginBottom: 4,
        }} />
        <View style={{
          width: 20,
          height: 2,
          backgroundColor: '#333333',
          marginBottom: 4,
        }} />
        <View style={{
          width: 20,
          height: 2,
          backgroundColor: '#333333',
        }} />
      </View>
    </TouchableOpacity>
  );
}

export default function DrawerLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer
        drawerContent={(props) => <CustomDrawerContent {...props} />}
        screenOptions={({ navigation }) => ({
          headerShown: true,
          headerStyle: {
            backgroundColor: '#FFFFFF',
            elevation: 1,
            shadowOpacity: 0.1,
          },
          headerTitleStyle: {
            fontSize: 18,
            fontWeight: '600',
            color: '#333333',
          },
          headerLeft: () => (
            <TouchableOpacity
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
              }}
              onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
            >
              <View>
                <View style={{
                  width: 20,
                  height: 2,
                  backgroundColor: '#333333',
                  marginBottom: 4,
                }} />
                <View style={{
                  width: 20,
                  height: 2,
                  backgroundColor: '#333333',
                  marginBottom: 4,
                }} />
                <View style={{
                  width: 20,
                  height: 2,
                  backgroundColor: '#333333',
                }} />
              </View>
            </TouchableOpacity>
          ),
          drawerStyle: {
            backgroundColor: '#FFFFFF',
            width: 280,
          },
          drawerActiveTintColor: '#007AFF',
          drawerInactiveTintColor: '#333333',
          swipeEnabled: true,
        })}
      >
        <Drawer.Screen
          name="index"
          options={{
            title: 'Chat with Alex',
          }}
        />
        <Drawer.Screen
          name="history"
          options={{
            title: 'Chat History',
          }}
        />
        <Drawer.Screen
          name="statistics"
          options={{
            title: 'Your Statistics',
          }}
        />
        <Drawer.Screen
          name="settings"
          options={{
            title: 'Settings',
          }}
        />
      </Drawer>
    </GestureHandlerRootView>
  );
}