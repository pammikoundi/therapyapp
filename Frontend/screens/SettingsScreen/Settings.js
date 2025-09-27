import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Switch,
  Alert,
  Image,
} from 'react-native';
import { SettingsStyles } from './styles/AppStyles';

const SettingsScreen = ({ navigation }) => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [reminderTime, setReminderTime] = useState('19:00');
  const [autoSave, setAutoSave] = useState(true);

  // Mock user data - replace with actual user data from your app state/context
  const userData = {
    name: 'John Doe',
    email: 'john.doe@example.com',
    profileImage: null, // Set to image URI when available
    joinDate: 'March 2024',
  };

  const ProfileSection = () => (
    <TouchableOpacity style={SettingsStyles.profileSection} onPress={() => console.log('Edit profile')}>
      <View style={SettingsStyles.profileImageContainer}>
        {userData.profileImage ? (
          <Image source={{ uri: userData.profileImage }} style={SettingsStyles.profileImage} />
        ) : (
          <View style={SettingsStyles.profileImagePlaceholder}>
            <Text style={SettingsStyles.profileImageText}>
              {userData.name.split(' ').map(n => n[0]).join('')}
            </Text>
          </View>
        )}
      </View>
      <View style={SettingsStyles.profileInfo}>
        <Text style={SettingsStyles.profileName}>{userData.name}</Text>
        <Text style={SettingsStyles.profileEmail}>{userData.email}</Text>
        <Text style={SettingsStyles.profileJoinDate}>Member since {userData.joinDate}</Text>
      </View>
      <Text style={SettingsStyles.profileArrow}>›</Text>
    </TouchableOpacity>
  );

  const SettingItem = ({ title, subtitle, onPress, rightComponent, isLast = false }) => (
    <TouchableOpacity 
      style={[SettingsStyles.settingItem, isLast && SettingsStyles.settingItemLast]} 
      onPress={onPress}
    >
      <View style={SettingsStyles.settingText}>
        <Text style={SettingsStyles.settingTitle}>{title}</Text>
        {subtitle && <Text style={SettingsStyles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {rightComponent && <View style={SettingsStyles.settingRight}>{rightComponent}</View>}
    </TouchableOpacity>
  );

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
    <SafeAreaView style={SettingsStyles.container}>
      <ScrollView style={SettingsStyles.scrollView}>
        <View style={SettingsStyles.header}>
          <Text style={SettingsStyles.headerTitle}>Settings</Text>
        </View>

        <ProfileSection />

        <View style={SettingsStyles.section}>
          <View style={SettingsStyles.sectionHeader}>
            <Text style={SettingsStyles.sectionTitle}>Profile</Text>
          </View>
          <SettingItem
            title="Edit Profile"
            subtitle="Update your personal information"
            onPress={() => console.log('Edit profile')}
            rightComponent={<Text style={SettingsStyles.arrow}>›</Text>}
          />
          <SettingItem
            title="Privacy Settings"
            subtitle="Manage your data and privacy"
            onPress={() => console.log('Privacy settings')}
            rightComponent={<Text style={SettingsStyles.arrow}>›</Text>}
            isLast={true}
          />
        </View>

        <View style={SettingsStyles.section}>
          <View style={SettingsStyles.sectionHeader}>
            <Text style={SettingsStyles.sectionTitle}>Notifications</Text>
          </View>
          <SettingItem
            title="Daily Reminders"
            subtitle="Get reminded to record your diary"
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
            rightComponent={<Text style={SettingsStyles.arrow}>›</Text>}
            isLast={true}
          />
        </View>

        <View style={SettingsStyles.section}>
          <View style={SettingsStyles.sectionHeader}>
            <Text style={SettingsStyles.sectionTitle}>App Preferences</Text>
          </View>
          <SettingItem
            title="Auto-save recordings"
            subtitle="Automatically save recordings after stopping"
            rightComponent={
              <Switch value={autoSave} onValueChange={setAutoSave} />
            }
          />
          <SettingItem
            title="Video Quality"
            subtitle="High quality (720p)"
            onPress={() => console.log('Video quality')}
            rightComponent={<Text style={SettingsStyles.arrow}>›</Text>}
          />
          <SettingItem
            title="Storage Management"
            subtitle="Manage local storage and backup"
            onPress={() => console.log('Storage management')}
            rightComponent={<Text style={SettingsStyles.arrow}>›</Text>}
            isLast={true}
          />
        </View>

        <View style={SettingsStyles.section}>
          <View style={SettingsStyles.sectionHeader}>
            <Text style={SettingsStyles.sectionTitle}>Support</Text>
          </View>
          <SettingItem
            title="Help & FAQ"
            onPress={() => console.log('Help')}
            rightComponent={<Text style={SettingsStyles.arrow}>›</Text>}
          />
          <SettingItem
            title="Contact Support"
            onPress={() => console.log('Contact support')}
            rightComponent={<Text style={SettingsStyles.arrow}>›</Text>}
          />
          <SettingItem
            title="About"
            onPress={() => console.log('About')}
            rightComponent={<Text style={SettingsStyles.arrow}>›</Text>}
            isLast={true}
          />
        </View>

        <TouchableOpacity style={SettingsStyles.logoutButton} onPress={handleLogout}>
          <Text style={SettingsStyles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SettingsScreen;