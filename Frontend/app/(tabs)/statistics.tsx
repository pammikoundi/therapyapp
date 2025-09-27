import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
} from 'react-native';

interface Stats {
  totalSessions: number;
  totalMessages: number;
  streakDays: number;
  averageSessionLength: string;
  weeklyGoal: number;
  weeklyProgress: number;
  moodTrend: string;
}

function StatCard({ title, value, subtitle }: { title: string; value: string | number; subtitle?: string }) {
  return (
    <View style={{
      width: '48%',
      backgroundColor: '#FFFFFF',
      borderRadius: 10,
      padding: 16,
      margin: '1%',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    }}>
      <Text style={{
        fontSize: 14,
        color: '#666666',
        marginBottom: 8,
      }}>
        {title}
      </Text>
      <Text style={{
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333333',
      }}>
        {value}
      </Text>
      {subtitle && (
        <Text style={{
          fontSize: 12,
          color: '#999999',
          marginTop: 4,
        }}>
          {subtitle}
        </Text>
      )}
    </View>
  );
}

export default function ProgressScreen() {
  const [stats, setStats] = useState<Stats>({
    totalSessions: 0,
    totalMessages: 0,
    streakDays: 0,
    averageSessionLength: '0 min',
    weeklyGoal: 5,
    weeklyProgress: 0,
    moodTrend: 'Improving',
  });

  useEffect(() => {
    // Mock data
    setStats({
      totalSessions: 15,
      totalMessages: 180,
      streakDays: 7,
      averageSessionLength: '12 min',
      weeklyGoal: 5,
      weeklyProgress: 4,
      moodTrend: 'Improving',
    });
  }, []);

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
            Your Progress
          </Text>
          <Text style={{
            fontSize: 14,
            color: '#666666',
            marginTop: 4,
          }}>
            Mental wellness journey
          </Text>
        </View>

        <View style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          paddingHorizontal: 16,
          marginTop: 12,
        }}>
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

        <View style={{
          margin: 20,
          padding: 20,
          backgroundColor: '#FFFFFF',
          borderRadius: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        }}>
          <Text style={{
            fontSize: 18,
            fontWeight: '600',
            color: '#333333',
            marginBottom: 12,
          }}>
            Weekly Goal Progress
          </Text>
          <View style={{
            height: 8,
            backgroundColor: '#E0E0E0',
            borderRadius: 4,
            marginVertical: 12,
          }}>
            <View style={{
              height: '100%',
              backgroundColor: '#007AFF',
              borderRadius: 4,
              width: `${(stats.weeklyProgress / stats.weeklyGoal) * 100}%`,
            }} />
          </View>
          <Text style={{
            textAlign: 'center',
            color: '#666666',
            fontSize: 14,
          }}>
            {stats.weeklyProgress} / {stats.weeklyGoal} sessions this week
          </Text>
        </View>

        <View style={{
          margin: 20,
          padding: 20,
          backgroundColor: '#FFFFFF',
          borderRadius: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        }}>
          <Text style={{
            fontSize: 18,
            fontWeight: '600',
            color: '#333333',
            marginBottom: 12,
          }}>
            Mood Insights
          </Text>
          <View style={{
            backgroundColor: '#F5F5F5',
            borderRadius: 8,
            padding: 16,
          }}>
            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: '#333333',
              marginBottom: 8,
            }}>
              📈 Your mood trend: {stats.moodTrend}
            </Text>
            <Text style={{
              fontSize: 14,
              color: '#666666',
              lineHeight: 18,
            }}>
              Based on your recent conversations, you seem to be feeling more positive and engaged.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}