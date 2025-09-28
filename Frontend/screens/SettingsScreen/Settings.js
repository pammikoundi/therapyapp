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
import { SettingsStyles } from './styles';

const SettingsScreen = ({ navigation }) => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [reminderTime, setReminderTime] = useState('19:00');
  const [autoSave, setAutoSave] = useState(true);

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

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'Are you sure you want to clear all recordings and data? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear Data', style: 'destructive', onPress: () => console.log('Clear data pressed') },
      ]
    );
  };

  return (
    <SafeAreaView style={SettingsStyles.container}>
      <ScrollView style={SettingsStyles.scrollView}>
        <View style={SettingsStyles.header}>
          <Text style={SettingsStyles.headerTitle}>Settings</Text>
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

        <TouchableOpacity style={SettingsStyles.clearDataButton} onPress={handleClearData}>
          <Text style={SettingsStyles.clearDataText}>Clear All Data</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SettingsScreen;