import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
  Platform,
  StatusBar,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../contexts/AuthContext';
import { useTask } from '../contexts/TaskContext';
import { useGamification } from '../contexts/GamificationContext';

const { width, height } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { tasks } = useTask();
  const { profile } = useGamification();
  
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    inProgress: 0,
    pending: 0,
  });

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    if (tasks) {
      const total = tasks.length;
      const completed = tasks.filter(task => task.status === 'завершено').length;
      const inProgress = tasks.filter(task => task.status === 'в работе').length;
      const pending = tasks.filter(task => task.status === 'создано').length;
      
      setStats({ total, completed, inProgress, pending });
    }
  }, [tasks]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const StatCard = ({ title, value, icon, color, gradient }) => (
    <Animated.View
      style={[
        styles.statCard,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <LinearGradient colors={gradient} style={styles.statCardGradient}>
        <Icon name={icon} size={32} color="#fff" style={styles.statIcon} />
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
      </LinearGradient>
    </Animated.View>
  );

  const QuickActionCard = ({ title, subtitle, icon, color, onPress }) => (
    <TouchableOpacity style={styles.quickActionCard} onPress={onPress}>
      <LinearGradient colors={color} style={styles.quickActionGradient}>
        <Icon name={icon} size={40} color="#fff" style={styles.quickActionIcon} />
        <View style={styles.quickActionContent}>
          <Text style={styles.quickActionTitle}>{title}</Text>
          <Text style={styles.quickActionSubtitle}>{subtitle}</Text>
        </View>
        <Icon name="chevron-right" size={24} color="rgba(255, 255, 255, 0.7)" />
      </LinearGradient>
    </TouchableOpacity>
  );

  const ProgressCard = () => (
    <Animated.View
      style={[
        styles.progressCard,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.progressCardGradient}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressTitle}>Прогресс сегодня</Text>
          <Text style={styles.progressSubtitle}>
            {stats.completed} из {stats.total} задач
          </Text>
        </View>
        
        <View style={styles.progressBar}>
          <View style={styles.progressBarBackground}>
            <View 
              style={[
                styles.progressBarFill, 
                { 
                  width: `${stats.total > 0 ? (stats.completed / stats.total) * 100 : 0}%` 
                }
              ]} 
            />
          </View>
        </View>
        
        <View style={styles.progressStats}>
          <View style={styles.progressStat}>
            <Text style={styles.progressStatValue}>{stats.completed}</Text>
            <Text style={styles.progressStatLabel}>Завершено</Text>
          </View>
          <View style={styles.progressStat}>
            <Text style={styles.progressStatValue}>{stats.inProgress}</Text>
            <Text style={styles.progressStatLabel}>В работе</Text>
          </View>
          <View style={styles.progressStat}>
            <Text style={styles.progressStatValue}>{stats.pending}</Text>
            <Text style={styles.progressStatLabel}>Ожидают</Text>
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <Icon name="person" size={40} color="#fff" />
            </View>
            <View style={styles.userText}>
              <Text style={styles.greeting}>Добро пожаловать!</Text>
              <Text style={styles.userName}>{user?.username || 'Пользователь'}</Text>
            </View>
          </View>
          
          {profile && (
            <View style={styles.levelInfo}>
              <Text style={styles.levelText}>Уровень {profile.level}</Text>
              <View style={styles.xpBar}>
                <View style={styles.xpBarBackground}>
                  <View 
                    style={[
                      styles.xpBarFill, 
                      { width: `${(profile.xp % 100) / 100 * 100}%` }
                    ]} 
                  />
                </View>
              </View>
            </View>
          )}
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.statsContainer}>
          <StatCard
            title="Всего задач"
            value={stats.total}
            icon="assignment"
            color="#4CAF50"
            gradient={['#4CAF50', '#45a049']}
          />
          <StatCard
            title="Завершено"
            value={stats.completed}
            icon="check-circle"
            color="#2196F3"
            gradient={['#2196F3', '#1976D2']}
          />
          <StatCard
            title="В работе"
            value={stats.inProgress}
            icon="pending"
            color="#FF9800"
            gradient={['#FF9800', '#F57C00']}
          />
          <StatCard
            title="Ожидают"
            value={stats.pending}
            icon="schedule"
            color="#9C27B0"
            gradient={['#9C27B0', '#7B1FA2']}
          />
        </View>

        <ProgressCard />

        <View style={styles.quickActionsContainer}>
          <Text style={styles.sectionTitle}>Быстрые действия</Text>
          
          <QuickActionCard
            title="Создать задачу"
            subtitle="Добавить новую задачу"
            icon="add-task"
            color={['#4CAF50', '#45a049']}
            onPress={() => navigation.navigate('TaskForm')}
          />
          
          <QuickActionCard
            title="Мои достижения"
            subtitle="Посмотреть прогресс"
            icon="emoji-events"
            color={['#FF9800', '#F57C00']}
            onPress={() => navigation.navigate('Gamification')}
          />
          
          <QuickActionCard
            title="AI-ассистент"
            subtitle="Получить помощь"
            icon="smart-toy"
            color={['#9C27B0', '#7B1FA2']}
            onPress={() => navigation.navigate('AI')}
          />
          
          <QuickActionCard
            title="Все задачи"
            subtitle="Управление задачами"
            icon="list"
            color={['#2196F3', '#1976D2']}
            onPress={() => navigation.navigate('Tasks')}
          />
        </View>

        <View style={styles.tipContainer}>
          <LinearGradient colors={['#f093fb', '#f5576c']} style={styles.tipGradient}>
            <Icon name="lightbulb" size={24} color="#fff" style={styles.tipIcon} />
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Совет дня</Text>
              <Text style={styles.tipText}>
                Разбивайте большие задачи на маленькие подзадачи для лучшего прогресса!
              </Text>
            </View>
          </LinearGradient>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  userText: {
    flex: 1,
  },
  greeting: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 5,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  levelInfo: {
    alignItems: 'flex-end',
  },
  levelText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 8,
  },
  xpBar: {
    width: 80,
  },
  xpBarBackground: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 3,
  },
  xpBarFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 3,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: -20,
    marginBottom: 20,
  },
  statCard: {
    width: (width - 60) / 2,
    marginBottom: 15,
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  statCardGradient: {
    padding: 20,
    alignItems: 'center',
  },
  statIcon: {
    marginBottom: 10,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  statTitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  progressCard: {
    marginBottom: 20,
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  progressCardGradient: {
    padding: 20,
  },
  progressHeader: {
    marginBottom: 20,
  },
  progressTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  progressSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  progressBar: {
    marginBottom: 20,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 4,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  progressStat: {
    alignItems: 'center',
  },
  progressStatValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  progressStatLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  quickActionsContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  quickActionCard: {
    marginBottom: 15,
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  quickActionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  quickActionIcon: {
    marginRight: 20,
  },
  quickActionContent: {
    flex: 1,
  },
  quickActionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  quickActionSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  tipContainer: {
    marginBottom: 30,
  },
  tipGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 15,
  },
  tipIcon: {
    marginRight: 15,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  tipText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 20,
  },
});

export default HomeScreen;
