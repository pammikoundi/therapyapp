import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';

function SettingItem({ 
  title, 
  subtitle, 
  onPress, 
  rightComponent, 
  isLast = false 
}: {
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightComponent?: React.ReactNode;
  isLast?: boolean;
}) {
  return (
    <TouchableOpacity 
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: '#E0E0E0',
      }}
      onPress={onPress}
    >
      <View style={{ flex: 1 }}>
        <Text style={{
          fontSize: 16,
          color: '#333333',
        }}>
          {title}
        </Text>
        {subtitle && (
          <Text style={{
            fontSize: 14,
            color: '#666666',
            marginTop: 4,
          }}>
            {subtitle}
          </Text>
        )}
      </View>
      {rightComponent && (
        <View style={{ marginLeft: 12 }}>
          {rightComponent}
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [reminderTime, setReminderTime] = useState('19:00');
  const [autoSave, setAutoSave] = useState(true);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', onPress: () => console.log('Logout pressed') },
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F5F5' }}>
      <ScrollView style={{ flex: 1 }}>
        <View style={{
          paddingHorizontal: 20,
          paddingVertical: 16,
          borderBottomWidth: 1,
          borderBottomColor: '#E0E0E0',
          backgroundColor: '#FFFFFF',
        }}>
          <Text style={{
            fontSize: 24,
            fontWeight: 'bold',
            color: '#333333',
          }}>
            Settings
          </Text>
        </View>

        <View style={{
          backgroundColor: '#FFFFFF',
          marginHorizontal: 20,
          marginTop: 20,
          borderRadius: 10,
          overflow: 'hidden',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 2,
          elevation: 1,
        }}>
          <View style={{
            paddingHorizontal: 16,
            paddingVertical: 12,
            backgroundColor: '#F5F5F5',
          }}>
            <Text style={{
              fontSize: 12,
              fontWeight: '600',
              color: '#666666',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}>
              Profile
            </Text>
          </View>
          <SettingItem
            title="Edit Profile"
            subtitle="Update your personal information"
            onPress={() => console.log('Edit profile')}
            rightComponent={<Text style={{ fontSize: 18, color: '#CCCCCC' }}>›</Text>}
          />
          <SettingItem
            title="Privacy Settings"
            subtitle="Manage your data and privacy"
            onPress={() => console.log('Privacy settings')}
            rightComponent={<Text style={{ fontSize: 18, color: '#CCCCCC' }}>›</Text>}
            isLast={true}
          />
        </View>

        <View style={{
          backgroundColor: '#FFFFFF',
          marginHorizontal: 20,
          marginTop: 20,
          borderRadius: 10,
          overflow: 'hidden',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 2,
          elevation: 1,
        }}>
          <View style={{
            paddingHorizontal: 16,
            paddingVertical: 12,
            backgroundColor: '#F5F5F5',
          }}>
            <Text style={{
              fontSize: 12,
              fontWeight: '600',
              color: '#666666',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}>
              Notifications
            </Text>
          </View>
          <SettingItem
            title="Daily Reminders"
            subtitle="Get reminded to chat with Alex"
            rightComponent={
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
              />
            }
          />
          <SettingItem
            title="Reminder Time"
            subtitle={`Currently set to ${reminderTime}`}
            onPress={() => console.log('Set reminder time')}
            rightComponent={<Text style={{ fontSize: 18, color: '#CCCCCC' }}>›</Text>}
            isLast={true}
          />
        </View>

        <View style={{
          backgroundColor: '#FFFFFF',
          marginHorizontal: 20,
          marginTop: 20,
          borderRadius: 10,
          overflow: 'hidden',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 2,
          elevation: 1,
        }}>
          <View style={{
            paddingHorizontal: 16,
            paddingVertical: 12,
            backgroundColor: '#F5F5F5',
          }}>
            <Text style={{
              fontSize: 12,
              fontWeight: '600',
              color: '#666666',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}>
              App Preferences
            </Text>
          </View>
          <SettingItem
            title="Auto-save conversations"
            subtitle="Automatically save chat history"
            rightComponent={
              <Switch value={autoSave} onValueChange={setAutoSave} />
            }
          />
          <SettingItem
            title="Theme"
            subtitle="Light mode"
            onPress={() => console.log('Theme settings')}
            rightComponent={<Text style={{ fontSize: 18, color: '#CCCCCC' }}>›</Text>}
            isLast={true}
          />
        </View>

        <TouchableOpacity 
          style={{
            backgroundColor: '#FF3B30',
            paddingVertical: 16,
            borderRadius: 8,
            alignItems: 'center',
            justifyContent: 'center',
            marginHorizontal: 20,
            marginVertical: 20,
          }}
          onPress={handleLogout}
        >
          <Text style={{
            fontSize: 16,
            fontWeight: '600',
            color: '#FFFFFF',
          }}>
            Logout
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}