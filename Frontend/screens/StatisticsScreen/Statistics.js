import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { StatisticsStyles } from './styles';
import Config from '../../app/config';

const StatisticsScreen = () => {
  const [stats, setStats] = useState({
    totalSessions: 0,
    totalMessages: 0,
    streakDays: 0,
    averageSessionLength: '0 min',
    weeklyGoal: 5,
    weeklyProgress: 0,
  });

  const [moodTrends, setMoodTrends] = useState(null);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Test API connection first, then fetch data
    initializeData();
  }, []);

  const initializeData = async () => {
    console.log('🚀 Initializing StatisticsScreen data...');
    console.log('🌐 Using API Base URL:', Config.API_BASE);
    
    // Test connection first
    try {
      const pingUrl = `${Config.API_BASE}/health`;
      console.log('Pinging backend health endpoint:', pingUrl);
      const pingRes = await fetch(pingUrl, { method: 'GET' });
      if (!pingRes.ok) {
        const txt = await pingRes.text().catch(() => '');
        console.warn('Health ping returned non-OK:', pingRes.status, txt);
        throw new Error(`Health check failed: ${pingRes.status}`);
      }
    } catch (e) {
      // Common cause in browsers: CORS blocked or wrong path (404). Provide guidance.
      console.error('Health check error:', e);
      setError('Unable to reach backend. Possible reasons: network, wrong API_BASE, or CORS restrictions. Check the console/network tab for details.');
      setLoading(false);
      return;
    }
    
    // If connection is good, fetch all data
    fetchAllData();
  };

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch all data concurrently
      await Promise.all([fetchStatistics(), fetchMoodTrends(), fetchGoals()]);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const res = await fetch(`${Config.API_BASE}/statistics`, { method: 'GET' });
      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(`Statistics API error ${res.status}: ${txt}`);
      }
      const data = await res.json();

      console.log('✅ Statistics data received:', data);

      // Map the API response to your stats state structure
      setStats(prevStats => ({
        ...prevStats,
        totalSessions: data.total_sessions || 0,
        streakDays: data.consecutive_days || 0,
        // You might need to calculate these from other endpoints or add them to your API
        totalMessages: data.total_messages || prevStats.totalMessages,
        averageSessionLength: data.average_session_length || prevStats.averageSessionLength,
        weeklyProgress: Math.min(data.total_sessions || 0, prevStats.weeklyGoal),
      }));

    } catch (err) {
      console.error('❌ Error fetching statistics:', err);
      throw err;
    }
  };

  const fetchMoodTrends = async () => {
    try {
      const res = await fetch(`${Config.API_BASE}/statistics/mood-trends`, { method: 'GET' });
      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(`Mood trends API error ${res.status}: ${txt}`);
      }
      const data = await res.json();

      console.log('✅ Mood trends data received:', data);

      // Transform the API response to match your expected structure
      const transformedData = {
        overall_trend: data.most_common_mood ? 'Improving' : 'No data',
        mood_counts: {
          positive: data.mood_trends?.happy || 0,
          neutral: (data.mood_trends?.neutral || 0) + (data.mood_trends?.okay || 0),
          negative: (data.mood_trends?.sad || 0) + (data.mood_trends?.anxious || 0) + (data.mood_trends?.angry || 0),
        },
        recent_mood_average: calculateMoodAverage(data.mood_trends),
        trend_direction: determineTrendDirection(data.mood_trends, data.most_common_mood),
        insights: generateInsights(data),
        raw_data: data, // Keep original data for debugging
      };

      setMoodTrends(transformedData);

    } catch (err) {
      console.error('❌ Error fetching mood trends:', err);
      throw err;
    }
  };

  const fetchGoals = async () => {
    try {
      const res = await fetch(`${Config.API_BASE}/goals`, { method: 'GET' });
      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        console.warn(`Goals API returned ${res.status}: ${txt}`);
        setGoals([]);
        return;
      }
      const data = await res.json();
      console.log('✅ Goals data received:', data);
      setGoals(data.goals || []);

    } catch (err) {
      console.error('⚠️ Error fetching goals (optional):', err);
      // Goals are optional, don't throw error
    }
  };

  // Helper functions to process mood data
  const calculateMoodAverage = (moodTrends) => {
    if (!moodTrends) return 0;
    
    const moodValues = {
      happy: 8,
      content: 7,
      okay: 5,
      neutral: 5,
      sad: 3,
      anxious: 3,
      angry: 2,
    };

    let totalScore = 0;
    let totalCount = 0;

    Object.entries(moodTrends).forEach(([mood, count]) => {
      const value = moodValues[mood] || 5;
      totalScore += value * count;
      totalCount += count;
    });

    return totalCount > 0 ? totalScore / totalCount : 0;
  };

  const determineTrendDirection = (moodTrends, mostCommonMood) => {
    if (!moodTrends || !mostCommonMood) return 'stable';
    
    const positiveMoods = ['happy', 'content'];
    const negativeMoods = ['sad', 'anxious', 'angry'];
    
    if (positiveMoods.includes(mostCommonMood)) return 'upward';
    if (negativeMoods.includes(mostCommonMood)) return 'downward';
    return 'stable';
  };

  const generateInsights = (data) => {
    const insights = [];
    
    if (data.total_entries === 0) {
      insights.push('Start tracking your mood to see personalized insights here.');
      return insights;
    }

    if (data.most_common_mood === 'happy') {
      insights.push('You\'ve been feeling mostly positive lately! Keep up the great work.');
    } else if (data.most_common_mood === 'sad') {
      insights.push('You\'ve had some challenging moments. Remember that it\'s okay to reach out for support.');
    } else if (data.most_common_mood) {
      insights.push(`Your most common mood has been ${data.most_common_mood}. Consider what factors might be influencing this.`);
    }

    if (data.mood_diversity > 1) {
      insights.push('You\'ve experienced a range of emotions, which is completely normal and healthy.');
    }

    if (data.from_sessions > 0) {
      insights.push('Your therapy sessions are contributing valuable mood insights to your progress tracking.');
    }

    return insights.length > 0 ? insights : ['Keep engaging with your mental health journey!'];
  };

  const getMoodTrendDisplay = () => {
    if (!moodTrends || !moodTrends.raw_data || moodTrends.raw_data.total_entries === 0) {
      return '📊 No data yet';
    }
    
    const trend = moodTrends.overall_trend;
    const emoji = trend === 'Improving' ? '📈' : 
                  trend === 'Stable' ? '📊' : 
                  trend === 'Declining' ? '📉' : '📊';
    
    return `${emoji} ${trend}`;
  };

  const getMoodInsights = () => {
    if (!moodTrends || !moodTrends.insights || moodTrends.insights.length === 0) {
      return 'Continue using the app to generate personalized mood insights.';
    }
    
    return moodTrends.insights[0];
  };

  const StatCard = ({ title, value, subtitle }) => (
    <View style={StatisticsStyles.statCard}>
      <Text style={StatisticsStyles.statTitle}>{title}</Text>
      <Text style={StatisticsStyles.statValue}>{value}</Text>
      {subtitle && <Text style={StatisticsStyles.statSubtitle}>{subtitle}</Text>}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={StatisticsStyles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={{ marginTop: 10 }}>Loading your progress...</Text>
          <Text style={{ marginTop: 5, fontSize: 12, color: '#666' }}>
            Fetching data from server...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={StatisticsStyles.container}>
      <ScrollView style={StatisticsStyles.scrollView}>
        <View style={StatisticsStyles.header}>
          <Text style={StatisticsStyles.headerTitle}>Your Progress</Text>
          <Text style={StatisticsStyles.headerSubtitle}>Mental wellness journey</Text>
        </View>

        {error && (
          <View style={[StatisticsStyles.errorContainer, { 
            backgroundColor: '#FFE6E6', 
            padding: 15, 
            margin: 10, 
            borderRadius: 8,
            borderLeftWidth: 4,
            borderLeftColor: '#FF0000'
          }]}>
            <Text style={[StatisticsStyles.errorText, { color: '#CC0000', fontWeight: 'bold' }]}>
              ⚠️ API Connection Issue
            </Text>
            <Text style={[StatisticsStyles.errorText, { color: '#CC0000', fontSize: 12, marginTop: 5 }]}>
              {error}
            </Text>
            <Text style={[StatisticsStyles.errorText, { color: '#666', fontSize: 11, marginTop: 5 }]}>
              Check your internet connection and try again.
            </Text>
          </View>
        )}

        <View style={StatisticsStyles.statsGrid}>
          <StatCard
            title="Chat Sessions"
            value={stats.totalSessions}
            subtitle="conversations with Alex"
          />
          <StatCard
            title="Current Streak"
            value={`${stats.streakDays} days`}
            subtitle="keep it up!"
          />
          <StatCard
            title="Weekly Goal"
            value={`${stats.weeklyProgress}/${stats.weeklyGoal}`}
            subtitle="sessions this week"
          />
          <StatCard
            title="Active Days"
            value={moodTrends?.raw_data?.from_sessions || 0}
            subtitle="with mood data"
          />
        </View>

        <View style={StatisticsStyles.section}>
          <Text style={StatisticsStyles.sectionTitle}>Weekly Goal Progress</Text>
          <View style={StatisticsStyles.progressBar}>
            <View
              style={[
                StatisticsStyles.progressFill,
                {
                  width: `${Math.min((stats.weeklyProgress / stats.weeklyGoal) * 100, 100)}%`,
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
              {getMoodTrendDisplay()}
            </Text>
            <Text style={StatisticsStyles.moodDescription}>
              {getMoodInsights()}
            </Text>
            
            {moodTrends && moodTrends.mood_counts && moodTrends.raw_data?.total_entries > 0 && (
              <View style={StatisticsStyles.moodCountsContainer}>
                <Text style={StatisticsStyles.moodCountsTitle}>Mood distribution:</Text>
                <Text style={StatisticsStyles.moodCount}>
                  😊 Positive: {moodTrends.mood_counts.positive}
                </Text>
                <Text style={StatisticsStyles.moodCount}>
                  😐 Neutral: {moodTrends.mood_counts.neutral}
                </Text>
                <Text style={StatisticsStyles.moodCount}>
                  😔 Negative: {moodTrends.mood_counts.negative}
                </Text>
                <Text style={StatisticsStyles.moodScore}>
                  Average mood: {moodTrends.recent_mood_average.toFixed(1)}/10
                </Text>
              </View>
            )}

            {moodTrends?.raw_data && (
              <Text style={{ fontSize: 12, color: '#999', marginTop: 10 }}>
                Based on {moodTrends.raw_data.total_entries} mood entries
              </Text>
            )}
          </View>
        </View>

        <View style={StatisticsStyles.section}>
          <Text style={StatisticsStyles.sectionTitle}>Recent Achievements</Text>
          <View style={StatisticsStyles.achievementsList}>
            {stats.streakDays > 0 && (
              <Text style={StatisticsStyles.achievement}>
                🏆 {stats.streakDays}-day chat streak
              </Text>
            )}
            {stats.totalSessions >= 5 && (
              <Text style={StatisticsStyles.achievement}>
                💫 Completed {stats.totalSessions}+ sessions
              </Text>
            )}
            {stats.weeklyProgress >= 3 && (
              <Text style={StatisticsStyles.achievement}>
                🌱 Consistent weekly check-ins
              </Text>
            )}
            {moodTrends && moodTrends.trend_direction === 'upward' && (
              <Text style={StatisticsStyles.achievement}>
                📈 Mood trending upward
              </Text>
            )}
            {moodTrends?.raw_data?.mood_diversity > 2 && (
              <Text style={StatisticsStyles.achievement}>
                🎭 Emotional awareness growing
              </Text>
            )}
            {!stats.streakDays && !stats.totalSessions && (
              <Text style={StatisticsStyles.achievement}>
                🌟 Welcome to your mental wellness journey!
              </Text>
            )}
          </View>
        </View>

        {goals.length > 0 && (
          <View style={StatisticsStyles.section}>
            <Text style={StatisticsStyles.sectionTitle}>Your Goals</Text>
            <View style={StatisticsStyles.achievementsList}>
              {goals.map((goal, index) => (
                <Text key={index} style={StatisticsStyles.achievement}>
                  🎯 {goal.title || goal}
                </Text>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default StatisticsScreen;