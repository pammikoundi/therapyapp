import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { StatisticsStyles } from '../styles/AppStyles';

const StatisticsScreen = () => {
  const [stats, setStats] = useState({
    totalSessions: 0,
    totalMessages: 0,
    streakDays: 0,
    averageSessionLength: '0 min',
    weeklyGoal: 5,
    weeklyProgress: 0,
    moodTrend: 'Improving',
  });

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = () => {
    // Mock data - replace with actual API call
    setStats({
      totalSessions: 15,
      totalMessages: 180,
      streakDays: 7,
      averageSessionLength: '12 min',
      weeklyGoal: 5,
      weeklyProgress: 4,
      moodTrend: 'Improving',
    });
  };

  const StatCard = ({ title, value, subtitle }) => (
    <View style={StatisticsStyles.statCard}>
      <Text style={StatisticsStyles.statTitle}>{title}</Text>
      <Text style={StatisticsStyles.statValue}>{value}</Text>
      {subtitle && <Text style={StatisticsStyles.statSubtitle}>{subtitle}</Text>}
    </View>
  );

  return (
    <SafeAreaView style={StatisticsStyles.container}>
      <ScrollView style={StatisticsStyles.scrollView}>
        <View style={StatisticsStyles.header}>
          <Text style={StatisticsStyles.headerTitle}>Your Progress</Text>
          <Text style={StatisticsStyles.headerSubtitle}>Mental wellness journey</Text>
        </View>

        <View style={StatisticsStyles.statsGrid}>
          <StatCard
            title="Chat Sessions"
            value={stats.totalSessions}
            subtitle="conversations with Alex"
          />
          
          <StatCard
            title="Messages Sent"
            value={stats.totalMessages}
            subtitle="thoughts shared"
          />
          
          <StatCard
            title="Current Streak"
            value={`${stats.streakDays} days`}
            subtitle="keep it up!"
          />
          
          <StatCard
            title="Avg Session"
            value={stats.averageSessionLength}
            subtitle="time spent reflecting"
          />
        </View>

        <View style={StatisticsStyles.section}>
          <Text style={StatisticsStyles.sectionTitle}>Weekly Goal Progress</Text>
          <View style={StatisticsStyles.progressBar}>
            <View
              style={[
                StatisticsStyles.progressFill,
                {
                  width: `${(stats.weeklyProgress / stats.weeklyGoal) * 100}%`,
                },
              ]}
            />
          </View>
          <Text style={StatisticsStyles.progressText}>
            {stats.weeklyProgress} / {stats.weeklyGoal} sessions this week
          </Text>
        </View>

        <View style={StatisticsStyles.section}>
          <Text style={StatisticsStyles.sectionTitle}>Mood Insights</Text>
          <View style={StatisticsStyles.moodContainer}>
            <Text style={StatisticsStyles.moodTrend}>
              📈 Your mood trend: {stats.moodTrend}
            </Text>
            <Text style={StatisticsStyles.moodDescription}>
              Based on your recent conversations, you seem to be feeling more positive and engaged.
            </Text>
          </View>
        </View>

        <View style={StatisticsStyles.section}>
          <Text style={StatisticsStyles.sectionTitle}>Recent Achievements</Text>
          <View style={StatisticsStyles.achievementsList}>
            <Text style={StatisticsStyles.achievement}>🏆 7-day chat streak</Text>
            <Text style={StatisticsStyles.achievement}>💫 Shared 50+ messages</Text>
            <Text style={StatisticsStyles.achievement}>🌱 Consistent weekly check-ins</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default StatisticsScreen;