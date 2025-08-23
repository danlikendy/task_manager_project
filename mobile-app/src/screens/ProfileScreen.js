import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, Modal, Dimensions, Switch, Platform,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import { useGamification } from '../contexts/GamificationContext';

const { width } = Dimensions.get('window');

const ProfileScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const { profile, getProfile, updateMood } = useGamification();
  const [loading, setLoading] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showMoodModal, setShowMoodModal] = useState(false);
  const [selectedMood, setSelectedMood] = useState(null);

  const [settings, setSettings] = useState({
    notifications: true,
    darkMode: false,
    autoSync: true,
    hapticFeedback: true,
    soundEffects: false,
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      await getProfile();
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const handleLogout = async () => {
    try {
      setLoading(true);
      await logout();
      setShowLogoutModal(false);
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось выйти из системы');
    } finally {
      setLoading(false);
    }
  };

  const handleMoodUpdate = async (mood) => {
    try {
      await updateMood(mood);
      setShowMoodModal(false);
      setSelectedMood(mood);
      Alert.alert('Успех', 'Настроение обновлено');
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось обновить настроение');
    }
  };

  const toggleSetting = (key) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const getMoodIcon = (mood) => {
    switch (mood) {
      case 'excellent': return 'sentiment-very-satisfied';
      case 'good': return 'sentiment-satisfied';
      case 'neutral': return 'sentiment-neutral';
      case 'bad': return 'sentiment-dissatisfied';
      case 'terrible': return 'sentiment-very-dissatisfied';
      default: return 'sentiment-neutral';
    }
  };

  const getMoodColor = (mood) => {
    switch (mood) {
      case 'excellent': return '#4CAF50';
      case 'good': return '#8BC34A';
      case 'neutral': return '#FFC107';
      case 'bad': return '#FF9800';
      case 'terrible': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const getMoodText = (mood) => {
    switch (mood) {
      case 'excellent': return 'Отлично';
      case 'good': return 'Хорошо';
      case 'neutral': return 'Нейтрально';
      case 'bad': return 'Плохо';
      case 'terrible': return 'Ужасно';
      default: return 'Не установлено';
    }
  };

  const ProfileHeader = () => (
    <View style={styles.profileHeader}>
      <LinearGradient
        colors={['#4CAF50', '#45a049']}
        style={styles.profileGradient}
      >
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Icon name="person" size={48} color="#fff" />
          </View>
        </View>
        
        <Text style={styles.userName}>{user?.username || 'Пользователь'}</Text>
        <Text style={styles.userEmail}>{user?.email || 'user@example.com'}</Text>
        
        {profile && (
          <View style={styles.levelInfo}>
            <Text style={styles.levelText}>Уровень {profile.level}</Text>
            <View style={styles.xpBar}>
              <View style={styles.xpProgress}>
                <View 
                  style={[
                    styles.xpFill, 
                    { width: `${(profile.xp % 100) / 100 * 100}%` }
                  ]} 
                />
              </View>
              <Text style={styles.xpText}>{profile.xp} XP</Text>
            </View>
          </View>
        )}
      </LinearGradient>
    </View>
  );

  const StatsSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Статистика</Text>
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Icon name="assignment" size={24} color="#4CAF50" />
          <Text style={styles.statNumber}>{profile?.total_tasks || 0}</Text>
          <Text style={styles.statLabel}>Всего задач</Text>
        </View>
        
        <View style={styles.statCard}>
          <Icon name="check-circle" size={24} color="#4CAF50" />
          <Text style={styles.statNumber}>{profile?.completed_tasks || 0}</Text>
          <Text style={styles.statLabel}>Завершено</Text>
        </View>
        
        <View style={styles.statCard}>
          <Icon name="emoji-events" size={24} color="#FF9800" />
          <Text style={styles.statNumber}>{profile?.achievements_count || 0}</Text>
          <Text style={styles.statLabel}>Достижения</Text>
        </View>
        
        <View style={styles.statCard}>
          <Icon name="monetization-on" size={24} color="#FFC107" />
          <Text style={styles.statNumber}>{profile?.coins || 0}</Text>
          <Text style={styles.statLabel}>Монеты</Text>
        </View>
      </View>
    </View>
  );

  const SettingsSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Настройки</Text>
      
      <View style={styles.settingItem}>
        <View style={styles.settingLeft}>
          <Icon name="notifications" size={24} color="#666" />
          <Text style={styles.settingLabel}>Уведомления</Text>
        </View>
        <Switch
          value={settings.notifications}
          onValueChange={() => toggleSetting('notifications')}
          trackColor={{ false: '#e0e0e0', true: '#4CAF50' }}
          thumbColor={settings.notifications ? '#fff' : '#f4f3f4'}
        />
      </View>

      <View style={styles.settingItem}>
        <View style={styles.settingLeft}>
          <Icon name="dark-mode" size={24} color="#666" />
          <Text style={styles.settingLabel}>Темная тема</Text>
        </View>
        <Switch
          value={settings.darkMode}
          onValueChange={() => toggleSetting('darkMode')}
          trackColor={{ false: '#e0e0e0', true: '#4CAF50' }}
          thumbColor={settings.darkMode ? '#fff' : '#f4f3f4'}
        />
      </View>

      <View style={styles.settingItem}>
        <View style={styles.settingLeft}>
          <Icon name="sync" size={24} color="#666" />
          <Text style={styles.settingLabel}>Автосинхронизация</Text>
        </View>
        <Switch
          value={settings.autoSync}
          onValueChange={() => toggleSetting('autoSync')}
          trackColor={{ false: '#e0e0e0', true: '#4CAF50' }}
          thumbColor={settings.autoSync ? '#fff' : '#f4f3f4'}
        />
      </View>

      <View style={styles.settingItem}>
        <View style={styles.settingLeft}>
          <Icon name="vibration" size={24} color="#666" />
          <Text style={styles.settingLabel}>Тактильная обратная связь</Text>
        </View>
        <Switch
          value={settings.hapticFeedback}
          onValueChange={() => toggleSetting('hapticFeedback')}
          trackColor={{ false: '#e0e0e0', true: '#4CAF50' }}
          thumbColor={settings.hapticFeedback ? '#fff' : '#f4f3f4'}
        />
      </View>

      <View style={styles.settingItem}>
        <View style={styles.settingLeft}>
          <Icon name="volume-up" size={24} color="#666" />
          <Text style={styles.settingLabel}>Звуковые эффекты</Text>
        </View>
        <Switch
          value={settings.soundEffects}
          onValueChange={() => toggleSetting('soundEffects')}
          trackColor={{ false: '#e0e0e0', true: '#4CAF50' }}
          thumbColor={settings.soundEffects ? '#fff' : '#f4f3f4'}
        />
      </View>
    </View>
  );

  const ActionsSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Действия</Text>
      
      <TouchableOpacity
        style={styles.actionButton}
        onPress={() => setShowMoodModal(true)}
      >
        <View style={styles.actionContent}>
          <View style={styles.actionLeft}>
            <Icon name="mood" size={24} color="#666" />
            <Text style={styles.actionLabel}>Настроение</Text>
          </View>
          <View style={styles.actionRight}>
            <Text style={styles.actionValue}>
              {profile?.mood ? getMoodText(profile.mood) : 'Не установлено'}
            </Text>
            <Icon name="chevron-right" size={20} color="#666" />
          </View>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.actionButton}>
        <View style={styles.actionContent}>
          <View style={styles.actionLeft}>
            <Icon name="backup" size={24} color="#666" />
            <Text style={styles.actionLabel}>Резервное копирование</Text>
          </View>
          <Icon name="chevron-right" size={20} color="#666" />
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.actionButton}>
        <View style={styles.actionContent}>
          <View style={styles.actionLeft}>
            <Icon name="help" size={24} color="#666" />
            <Text style={styles.actionLabel}>Помощь</Text>
          </View>
          <Icon name="chevron-right" size={20} color="#666" />
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.actionButton}>
        <View style={styles.actionContent}>
          <View style={styles.actionLeft}>
            <Icon name="info" size={24} color="#666" />
            <Text style={styles.actionLabel}>О приложении</Text>
          </View>
          <Icon name="chevron-right" size={20} color="#666" />
        </View>
      </TouchableOpacity>
    </View>
  );

  const LogoutModal = () => (
    <Modal
      visible={showLogoutModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowLogoutModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.logoutModal}>
          <Icon name="logout" size={48} color="#F44336" style={styles.logoutIcon} />
          <Text style={styles.logoutTitle}>Выйти из системы?</Text>
          <Text style={styles.logoutMessage}>
            Вы уверены, что хотите выйти? Все несохраненные данные будут потеряны.
          </Text>
          
          <View style={styles.logoutActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowLogoutModal(false)}
            >
              <Text style={styles.cancelButtonText}>Отмена</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.logoutButtonText}>Выйти</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const MoodModal = () => (
    <Modal
      visible={showMoodModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowMoodModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.moodModal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Как ваше настроение?</Text>
            <TouchableOpacity onPress={() => setShowMoodModal(false)}>
              <Icon name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.moodOptions}>
            {[
              { mood: 'excellent', label: 'Отлично', icon: 'sentiment-very-satisfied' },
              { mood: 'good', label: 'Хорошо', icon: 'sentiment-satisfied' },
              { mood: 'neutral', label: 'Нейтрально', icon: 'sentiment-neutral' },
              { mood: 'bad', label: 'Плохо', icon: 'sentiment-dissatisfied' },
              { mood: 'terrible', label: 'Ужасно', icon: 'sentiment-very-dissatisfied' }
            ].map(option => (
              <TouchableOpacity
                key={option.mood}
                style={[
                  styles.moodOption,
                  profile?.mood === option.mood && styles.moodOptionActive
                ]}
                onPress={() => handleMoodUpdate(option.mood)}
              >
                <Icon 
                  name={option.icon} 
                  size={32} 
                  color={getMoodColor(option.mood)} 
                />
                <Text style={[
                  styles.moodOptionText,
                  profile?.mood === option.mood && styles.moodOptionTextActive
                ]}>
                  {option.label}
                </Text>
                {profile?.mood === option.mood && (
                  <Icon name="check" size={20} color="#4CAF50" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <ProfileHeader />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <StatsSection />
        <SettingsSection />
        <ActionsSection />
        
        <TouchableOpacity
          style={styles.logoutButtonLarge}
          onPress={() => setShowLogoutModal(true)}
        >
          <LinearGradient
            colors={['#F44336', '#D32F2F']}
            style={styles.logoutButtonGradient}
          >
            <Icon name="logout" size={20} color="#fff" />
            <Text style={styles.logoutButtonLargeText}>Выйти из системы</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>

      <LogoutModal />
      <MoodModal />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  profileHeader: {
    borderRadius: 0,
    overflow: 'hidden',
  },
  profileGradient: {
    padding: 24,
    alignItems: 'center',
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 20,
  },
  levelInfo: {
    alignItems: 'center',
  },
  levelText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  xpBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  xpProgress: {
    width: 120,
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  xpFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 4,
  },
  xpText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  actionButton: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  actionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  actionLabel: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  actionRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionValue: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  logoutButtonLarge: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 32,
  },
  logoutButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  logoutButtonLargeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutModal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 30,
    width: width * 0.9,
    maxWidth: 400,
    alignItems: 'center',
  },
  logoutIcon: {
    marginBottom: 16,
  },
  logoutTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  logoutMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  logoutActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
  },
  logoutButton: {
    backgroundColor: '#F44336',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  logoutButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  moodModal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: width * 0.9,
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  moodOptions: {
    padding: 20,
  },
  moodOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#f5f5f5',
  },
  moodOptionActive: {
    backgroundColor: '#e8f5e8',
  },
  moodOptionText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
    flex: 1,
  },
  moodOptionTextActive: {
    color: '#4CAF50',
    fontWeight: '600',
  },
});

export default ProfileScreen;
