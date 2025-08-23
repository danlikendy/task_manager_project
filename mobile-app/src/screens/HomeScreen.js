import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import { useTasks } from '../contexts/TaskContext';
import { useGamification } from '../contexts/GamificationContext';

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { tasks, getTasks } = useTasks();
  const { profile, getProfile } = useGamification();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      await Promise.all([getTasks(), getProfile()]);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getTaskStats = () => {
    const total = tasks.length;
    const completed = tasks.filter(task => task.status === 'завершено').length;
    const inProgress = tasks.filter(task => task.status === 'в работе').length;
    const pending = tasks.filter(task => task.status === 'создано').length;
    
    return { total, completed, inProgress, pending };
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return '#f44336';
      case 'urgent': return '#ff9800';
      case 'high': return '#ff5722';
      case 'medium': return '#ffc107';
      case 'low': return '#4caf50';
      default: return '#9e9e9e';
    }
  };

  const getPriorityText = (priority) => {
    switch (priority) {
      case 'critical': return 'Критический';
      case 'urgent': return 'Срочный';
      case 'high': return 'Высокий';
      case 'medium': return 'Средний';
      case 'low': return 'Низкий';
      default: return 'Не указан';
    }
  };

  const stats = getTaskStats();

  const QuickActionCard = ({ icon, title, subtitle, onPress, color, gradient }) => (
    <TouchableOpacity style={styles.quickActionCard} onPress={onPress}>
      <LinearGradient
        colors={gradient || ['#4CAF50', '#45a049']}
        style={[styles.quickActionGradient, { backgroundColor: color }]}
      >
        <Icon name={icon} size={32} color="#fff" />
      </LinearGradient>
      <View style={styles.quickActionContent}>
        <Text style={styles.quickActionTitle}>{title}</Text>
        <Text style={styles.quickActionSubtitle}>{subtitle}</Text>
      </View>
    </TouchableOpacity>
  );

  const StatCard = ({ title, value, subtitle, color, icon }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statHeader}>
        <Icon name={icon} size={24} color={color} />
        <Text style={styles.statTitle}>{title}</Text>
      </View>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statSubtitle}>{subtitle}</Text>
    </View>
  );

  const TaskCard = ({ task }) => (
    <TouchableOpacity
      style={styles.taskCard}
      onPress={() => navigation.navigate('Tasks', { taskId: task.id })}
    >
      <View style={styles.taskHeader}>
        <Text style={styles.taskTitle} numberOfLines={2}>
          {task.title}
        </Text>
        <View style={[
          styles.priorityBadge,
          { backgroundColor: getPriorityColor(task.priority) }
        ]}>
          <Text style={styles.priorityText}>
            {getPriorityText(task.priority)}
          </Text>
        </View>
      </View>
      
      {task.description && (
        <Text style={styles.taskDescription} numberOfLines={2}>
          {task.description}
        </Text>
      )}
      
      <View style={styles.taskFooter}>
        <View style={styles.taskStatus}>
          <Icon
            name={
              task.status === 'завершено' ? 'check-circle' :
              task.status === 'в работе' ? 'play-circle-outline' :
              'schedule'
            }
            size={16}
            color={
              task.status === 'завершено' ? '#4CAF50' :
              task.status === 'в работе' ? '#2196F3' :
              '#9E9E9E'
            }
          />
          <Text style={styles.taskStatusText}>
            {task.status === 'завершено' ? 'Завершено' :
             task.status === 'в работе' ? 'В работе' :
             'Создано'}
          </Text>
        </View>
        
        {task.due_date && (
          <View style={styles.taskDueDate}>
            <Icon name="event" size={16} color="#FF9800" />
            <Text style={styles.taskDueDateText}>
              {new Date(task.due_date).toLocaleDateString('ru-RU')}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Приветствие */}
      <LinearGradient
        colors={['#4CAF50', '#45a049']}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <View style={styles.userInfo}>
            <Text style={styles.greeting}>
              Привет, {user?.username || 'Пользователь'}!
            </Text>
            <Text style={styles.subtitle}>
              Готов к продуктивному дню?
            </Text>
          </View>
          
          {profile && (
            <View style={styles.levelInfo}>
              <Text style={styles.levelText}>Уровень {profile.level}</Text>
              <View style={styles.xpBar}>
                <View
                  style={[
                    styles.xpProgress,
                    {
                      width: `${((profile.current_xp - profile.previous_level_xp) /
                        (profile.next_level_xp - profile.previous_level_xp)) * 100}%`
                    }
                  ]}
                />
              </View>
              <Text style={styles.xpText}>
                {profile.current_xp} / {profile.next_level_xp} XP
              </Text>
            </View>
          )}
        </View>
      </LinearGradient>

      {/* Быстрые действия */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Быстрые действия</Text>
        <View style={styles.quickActionsGrid}>
          <QuickActionCard
            icon="add"
            title="Новая задача"
            subtitle="Создать задачу"
            onPress={() => navigation.navigate('Tasks', { createNew: true })}
            gradient={['#2196F3', '#1976D2']}
          />
          <QuickActionCard
            icon="smart-toy"
            title="AI-помощник"
            subtitle="Умное создание"
            onPress={() => navigation.navigate('AI')}
            gradient={['#9C27B0', '#7B1FA2']}
          />
          <QuickActionCard
            icon="emoji-events"
            title="Достижения"
            subtitle="Прогресс"
            onPress={() => navigation.navigate('Gamification')}
            gradient={['#FF9800', '#F57C00']}
          />
          <QuickActionCard
            icon="analytics"
            title="Статистика"
            subtitle="Анализ"
            onPress={() => navigation.navigate('Profile')}
            gradient={['#607D8B', '#455A64']}
          />
        </View>
      </View>

      {/* Статистика */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Статистика задач</Text>
        <View style={styles.statsGrid}>
          <StatCard
            title="Всего задач"
            value={stats.total}
            subtitle="Общее количество"
            color="#2196F3"
            icon="assignment"
          />
          <StatCard
            title="Завершено"
            value={stats.completed}
            subtitle="Выполнено"
            color="#4CAF50"
            icon="check-circle"
          />
          <StatCard
            title="В работе"
            value={stats.inProgress}
            subtitle="Активные"
            color="#FF9800"
            icon="play-circle-outline"
          />
          <StatCard
            title="Ожидают"
            value={stats.pending}
            subtitle="Новые"
            color="#9E9E9E"
            icon="schedule"
          />
        </View>
      </View>

      {/* Последние задачи */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Последние задачи</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Tasks')}>
            <Text style={styles.seeAllText}>Посмотреть все</Text>
          </TouchableOpacity>
        </View>
        
        {tasks.slice(0, 3).map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
        
        {tasks.length === 0 && (
          <View style={styles.emptyState}>
            <Icon name="assignment" size={64} color="#ccc" />
            <Text style={styles.emptyStateText}>Нет задач</Text>
            <Text style={styles.emptyStateSubtext}>
              Создайте свою первую задачу!
            </Text>
            <TouchableOpacity
              style={styles.createFirstTaskButton}
              onPress={() => navigation.navigate('Tasks', { createNew: true })}
            >
              <Text style={styles.createFirstTaskButtonText}>
                Создать задачу
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Ежедневные вызовы */}
      {profile && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ежедневные вызовы</Text>
          <View style={styles.challengeCard}>
            <Icon name="emoji-events" size={32} color="#FF9800" />
            <View style={styles.challengeContent}>
              <Text style={styles.challengeTitle}>
                Утренняя продуктивность
              </Text>
              <Text style={styles.challengeDescription}>
                Завершите 3 задачи до 12:00
              </Text>
              <View style={styles.challengeProgress}>
                <View style={styles.challengeProgressBar}>
                  <View
                    style={[
                      styles.challengeProgressFill,
                      { width: `${Math.min((stats.completed / 3) * 100, 100)}%` }
                    ]}
                  />
                </View>
                <Text style={styles.challengeProgressText}>
                  {stats.completed}/3
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerGradient: {
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#e8f5e8',
  },
  levelInfo: {
    alignItems: 'center',
  },
  levelText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  xpBar: {
    width: 100,
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 4,
    marginBottom: 5,
  },
  xpProgress: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 4,
  },
  xpText: {
    fontSize: 12,
    color: '#fff',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  seeAllText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '500',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionCard: {
    width: (width - 60) / 2,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionGradient: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  quickActionContent: {
    flex: 1,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  quickActionSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: (width - 60) / 2,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  statTitle: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  statSubtitle: {
    fontSize: 12,
    color: '#999',
  },
  taskCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 10,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  taskDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    lineHeight: 20,
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskStatusText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 5,
  },
  taskDueDate: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskDueDateText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 5,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#999',
    marginTop: 15,
    marginBottom: 5,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 20,
    textAlign: 'center',
  },
  createFirstTaskButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  createFirstTaskButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  challengeCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  challengeContent: {
    flex: 1,
    marginLeft: 15,
  },
  challengeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  challengeDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  challengeProgress: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  challengeProgressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    marginRight: 10,
  },
  challengeProgressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 3,
  },
  challengeProgressText: {
    fontSize: 12,
    color: '#666',
    fontWeight: 'bold',
  },
});

export default HomeScreen;
