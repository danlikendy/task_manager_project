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
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useGamification } from '../contexts/GamificationContext';

const { width } = Dimensions.get('window');

const GamificationScreen = () => {
  const { profile, achievements, challenges, rewards, getProfile, getAchievements, getChallenges, getRewards } = useGamification();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState(null);
  const [selectedReward, setSelectedReward] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      await Promise.all([
        getProfile(),
        getAchievements(),
        getChallenges(),
        getRewards()
      ]);
    } catch (error) {
      console.error('Error loading gamification data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'legendary': return '#FFD700';
      case 'epic': return '#9C27B0';
      case 'rare': return '#2196F3';
      case 'common': return '#4CAF50';
      default: return '#9E9E9E';
    }
  };

  const getRarityText = (rarity) => {
    switch (rarity) {
      case 'legendary': return 'Легендарное';
      case 'epic': return 'Эпическое';
      case 'rare': return 'Редкое';
      case 'common': return 'Обычное';
      default: return 'Неизвестно';
    }
  };

  const getMoodIcon = (mood) => {
    switch (mood) {
      case 'excited': return 'sentiment-very-satisfied';
      case 'happy': return 'sentiment-satisfied';
      case 'neutral': return 'sentiment-neutral';
      case 'sad': return 'sentiment-dissatisfied';
      case 'angry': return 'sentiment-very-dissatisfied';
      default: return 'sentiment-neutral';
    }
  };

  const getMoodColor = (mood) => {
    switch (mood) {
      case 'excited': return '#4CAF50';
      case 'happy': return '#8BC34A';
      case 'neutral': return '#FFC107';
      case 'sad': return '#FF9800';
      case 'angry': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const AchievementCard = ({ achievement }) => (
    <TouchableOpacity
      style={[
        styles.achievementCard,
        { borderColor: getRarityColor(achievement.rarity) }
      ]}
      onPress={() => setSelectedAchievement(achievement)}
    >
      <View style={styles.achievementHeader}>
        <View style={[
          styles.achievementIcon,
          { backgroundColor: getRarityColor(achievement.rarity) }
        ]}>
          <Icon
            name={achievement.is_unlocked ? 'emoji-events' : 'lock'}
            size={24}
            color="#fff"
          />
        </View>
        <View style={styles.achievementInfo}>
          <Text style={styles.achievementTitle}>{achievement.title}</Text>
          <Text style={styles.achievementDescription} numberOfLines={2}>
            {achievement.description}
          </Text>
        </View>
        <View style={styles.achievementRewards}>
          <Text style={styles.xpReward}>+{achievement.xp_reward} XP</Text>
          <Text style={styles.coinReward}>+{achievement.coin_reward} 🪙</Text>
        </View>
      </View>
      
      <View style={styles.achievementFooter}>
        <View style={[
          styles.rarityBadge,
          { backgroundColor: getRarityColor(achievement.rarity) }
        ]}>
          <Text style={styles.rarityText}>
            {getRarityText(achievement.rarity)}
          </Text>
        </View>
        
        {achievement.is_unlocked ? (
          <View style={styles.unlockedInfo}>
            <Icon name="check-circle" size={16} color="#4CAF50" />
            <Text style={styles.unlockedText}>
              Получено {achievement.unlocked_at ? 
                new Date(achievement.unlocked_at).toLocaleDateString('ru-RU') : 
                'недавно'
              }
            </Text>
          </View>
        ) : (
          <Text style={styles.lockedText}>Заблокировано</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const ChallengeCard = ({ challenge }) => (
    <View style={styles.challengeCard}>
      <View style={styles.challengeHeader}>
        <Icon name="emoji-events" size={32} color="#FF9800" />
        <View style={styles.challengeInfo}>
          <Text style={styles.challengeTitle}>{challenge.title}</Text>
          <Text style={styles.challengeDescription}>
            {challenge.description}
          </Text>
        </View>
      </View>
      
      <View style={styles.challengeProgress}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${(challenge.current_progress / challenge.target) * 100}%` }
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {challenge.current_progress} / {challenge.target}
        </Text>
      </View>
      
      <View style={styles.challengeRewards}>
        <View style={styles.rewardItem}>
          <Icon name="star" size={16} color="#FFD700" />
          <Text style={styles.rewardText}>+{challenge.xp_reward} XP</Text>
        </View>
        <View style={styles.rewardItem}>
          <Icon name="monetization-on" size={16} color="#FFD700" />
          <Text style={styles.rewardText}>+{challenge.coin_reward} 🪙</Text>
        </View>
      </View>
      
      {challenge.is_completed && (
        <View style={styles.completedBadge}>
          <Icon name="check-circle" size={16} color="#4CAF50" />
          <Text style={styles.completedText}>Завершено!</Text>
        </View>
      )}
    </View>
  );

  const RewardCard = ({ reward }) => (
    <TouchableOpacity
      style={styles.rewardCard}
      onPress={() => setSelectedReward(reward)}
    >
      <View style={styles.rewardHeader}>
        <View style={[
          styles.rewardIcon,
          { backgroundColor: reward.is_purchased ? '#9E9E9E' : '#4CAF50' }
        ]}>
          <Icon
            name={reward.is_purchased ? 'check' : 'shopping-cart'}
            size={24}
            color="#fff"
          />
        </View>
        <View style={styles.rewardInfo}>
          <Text style={styles.rewardTitle}>{reward.title}</Text>
          <Text style={styles.rewardDescription} numberOfLines={2}>
            {reward.description}
          </Text>
        </View>
        <View style={styles.rewardPrice}>
          <Text style={styles.priceText}>{reward.price} 🪙</Text>
        </View>
      </View>
      
      <View style={styles.rewardFooter}>
        <View style={[
          styles.categoryBadge,
          { backgroundColor: reward.is_purchased ? '#9E9E9E' : '#2196F3' }
        ]}>
          <Text style={styles.categoryText}>
            {reward.category === 'profile' ? 'Профиль' :
             reward.category === 'functional' ? 'Функции' :
             reward.category === 'cosmetic' ? 'Косметика' : 'Другое'}
          </Text>
        </View>
        
        {reward.is_purchased ? (
          <Text style={styles.purchasedText}>Куплено</Text>
        ) : (
          <Text style={styles.availableText}>Доступно</Text>
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
      {/* Профиль пользователя */}
      {profile && (
        <LinearGradient
          colors={['#4CAF50', '#45a049']}
          style={styles.profileGradient}
        >
          <View style={styles.profileContent}>
            <View style={styles.profileInfo}>
              <Text style={styles.profileTitle}>Профиль геймификации</Text>
              <View style={styles.levelSection}>
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
            </View>
            
            <View style={styles.profileStats}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{profile.coins}</Text>
                <Text style={styles.statLabel}>Монеты</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{profile.achievements_count}</Text>
                <Text style={styles.statLabel}>Достижения</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{profile.challenges_completed}</Text>
                <Text style={styles.statLabel}>Вызовы</Text>
              </View>
            </View>
            
            {profile.mood && (
              <View style={styles.moodSection}>
                <Icon
                  name={getMoodIcon(profile.mood)}
                  size={24}
                  color={getMoodColor(profile.mood)}
                />
                <Text style={styles.moodText}>
                  Настроение: {profile.mood === 'excited' ? 'В восторге' :
                               profile.mood === 'happy' ? 'Радостное' :
                               profile.mood === 'neutral' ? 'Нейтральное' :
                               profile.mood === 'sad' ? 'Грустное' :
                               profile.mood === 'angry' ? 'Сердитое' : 'Неизвестно'}
                </Text>
                {profile.mood_note && (
                  <Text style={styles.moodNote}>{profile.mood_note}</Text>
                )}
              </View>
            )}
          </View>
        </LinearGradient>
      )}

      {/* Достижения */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Достижения</Text>
        <Text style={styles.sectionSubtitle}>
          {achievements?.filter(a => a.is_unlocked).length || 0} из {achievements?.length || 0} получено
        </Text>
        
        {achievements?.map((achievement) => (
          <AchievementCard key={achievement.id} achievement={achievement} />
        ))}
        
        {(!achievements || achievements.length === 0) && (
          <View style={styles.emptyState}>
            <Icon name="emoji-events" size={64} color="#ccc" />
            <Text style={styles.emptyStateText}>Нет достижений</Text>
            <Text style={styles.emptyStateSubtext}>
              Выполняйте задачи для получения достижений!
            </Text>
          </View>
        )}
      </View>

      {/* Вызовы */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ежедневные вызовы</Text>
        <Text style={styles.sectionSubtitle}>
          {challenges?.filter(c => c.is_completed).length || 0} из {challenges?.length || 0} завершено
        </Text>
        
        {challenges?.map((challenge) => (
          <ChallengeCard key={challenge.id} challenge={challenge} />
        ))}
        
        {(!challenges || challenges.length === 0) && (
          <View style={styles.emptyState}>
            <Icon name="emoji-events" size={64} color="#ccc" />
            <Text style={styles.emptyStateText}>Нет вызовов</Text>
            <Text style={styles.emptyStateSubtext}>
              Новые вызовы появятся завтра!
            </Text>
          </View>
        )}
      </View>

      {/* Награды */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Магазин наград</Text>
        <Text style={styles.sectionSubtitle}>
          {rewards?.filter(r => r.is_purchased).length || 0} из {rewards?.length || 0} куплено
        </Text>
        
        {rewards?.map((reward) => (
          <RewardCard key={reward.id} reward={reward} />
        ))}
        
        {(!rewards || rewards.length === 0) && (
          <View style={styles.emptyState}>
            <Icon name="card-giftcard" size={64} color="#ccc" />
            <Text style={styles.emptyStateText}>Нет наград</Text>
            <Text style={styles.emptyStateSubtext}>
              Награды появятся позже!
            </Text>
          </View>
        )}
      </View>

      {/* Модальное окно достижения */}
      <Modal
        visible={!!selectedAchievement}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSelectedAchievement(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedAchievement && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{selectedAchievement.title}</Text>
                  <TouchableOpacity onPress={() => setSelectedAchievement(null)}>
                    <Icon name="close" size={24} color="#666" />
                  </TouchableOpacity>
                </View>
                
                <Text style={styles.modalDescription}>
                  {selectedAchievement.description}
                </Text>
                
                <View style={styles.modalRewards}>
                  <View style={styles.modalRewardItem}>
                    <Icon name="star" size={20} color="#FFD700" />
                    <Text style={styles.modalRewardText}>
                      +{selectedAchievement.xp_reward} XP
                    </Text>
                  </View>
                  <View style={styles.modalRewardItem}>
                    <Icon name="monetization-on" size={20} color="#FFD700" />
                    <Text style={styles.modalRewardText}>
                      +{selectedAchievement.coin_reward} монет
                    </Text>
                  </View>
                </View>
                
                <View style={[
                  styles.modalRarity,
                  { backgroundColor: getRarityColor(selectedAchievement.rarity) }
                ]}>
                  <Text style={styles.modalRarityText}>
                    {getRarityText(selectedAchievement.rarity)}
                  </Text>
                </View>
                
                {selectedAchievement.is_unlocked ? (
                  <View style={styles.modalUnlocked}>
                    <Icon name="check-circle" size={24} color="#4CAF50" />
                    <Text style={styles.modalUnlockedText}>
                      Достижение получено!
                    </Text>
                    {selectedAchievement.unlocked_at && (
                      <Text style={styles.modalUnlockedDate}>
                        {new Date(selectedAchievement.unlocked_at).toLocaleDateString('ru-RU')}
                      </Text>
                    )}
                  </View>
                ) : (
                  <View style={styles.modalLocked}>
                    <Icon name="lock" size={24} color="#9E9E9E" />
                    <Text style={styles.modalLockedText}>
                      Достижение заблокировано
                    </Text>
                  </View>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Модальное окно награды */}
      <Modal
        visible={!!selectedReward}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSelectedReward(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedReward && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{selectedReward.title}</Text>
                  <TouchableOpacity onPress={() => setSelectedReward(null)}>
                    <Icon name="close" size={24} color="#666" />
                  </TouchableOpacity>
                </View>
                
                <Text style={styles.modalDescription}>
                  {selectedReward.description}
                </Text>
                
                <View style={styles.modalPrice}>
                  <Icon name="monetization-on" size={24} color="#FFD700" />
                  <Text style={styles.modalPriceText}>
                    {selectedReward.price} монет
                  </Text>
                </View>
                
                <View style={[
                  styles.modalCategory,
                  { backgroundColor: selectedReward.is_purchased ? '#9E9E9E' : '#2196F3' }
                ]}>
                  <Text style={styles.modalCategoryText}>
                    {selectedReward.category === 'profile' ? 'Профиль' :
                     selectedReward.category === 'functional' ? 'Функции' :
                     selectedReward.category === 'cosmetic' ? 'Косметика' : 'Другое'}
                  </Text>
                </View>
                
                {selectedReward.is_purchased ? (
                  <View style={styles.modalPurchased}>
                    <Icon name="check-circle" size={24} color="#4CAF50" />
                    <Text style={styles.modalPurchasedText}>
                      Награда куплена!
                    </Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.modalBuyButton}
                    onPress={() => {
                      Alert.alert(
                        'Покупка награды',
                        `Купить "${selectedReward.title}" за ${selectedReward.price} монет?`,
                        [
                          { text: 'Отмена', style: 'cancel' },
                          { text: 'Купить', onPress: () => {
                            // Логика покупки
                            Alert.alert('Успех!', 'Награда куплена!');
                            setSelectedReward(null);
                          }}
                        ]
                      );
                    }}
                  >
                    <Text style={styles.modalBuyButtonText}>Купить</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  profileGradient: {
    padding: 20,
  },
  profileContent: {
    alignItems: 'center',
  },
  profileTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  levelSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  levelText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  xpBar: {
    width: 200,
    height: 10,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 5,
    marginBottom: 5,
  },
  xpProgress: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 5,
  },
  xpText: {
    fontSize: 14,
    color: '#fff',
  },
  profileStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: '#e8f5e8',
    marginTop: 5,
  },
  moodSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 10,
    borderRadius: 20,
  },
  moodText: {
    fontSize: 14,
    color: '#fff',
    marginLeft: 10,
  },
  moodNote: {
    fontSize: 12,
    color: '#e8f5e8',
    marginTop: 5,
    fontStyle: 'italic',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  achievementCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  achievementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  achievementIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  achievementDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  achievementRewards: {
    alignItems: 'flex-end',
  },
  xpReward: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 2,
  },
  coinReward: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  achievementFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rarityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  rarityText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  unlockedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  unlockedText: {
    fontSize: 12,
    color: '#4CAF50',
    marginLeft: 5,
  },
  lockedText: {
    fontSize: 12,
    color: '#9E9E9E',
  },
  challengeCard: {
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
  challengeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  challengeInfo: {
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
  },
  challengeProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginRight: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
  },
  challengeRewards: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rewardText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 5,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    borderRadius: 20,
  },
  completedText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  rewardCard: {
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
  rewardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  rewardIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  rewardInfo: {
    flex: 1,
  },
  rewardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  rewardDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  rewardPrice: {
    alignItems: 'flex-end',
  },
  priceText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  rewardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  categoryText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  purchasedText: {
    fontSize: 12,
    color: '#9E9E9E',
  },
  availableText: {
    fontSize: 12,
    color: '#4CAF50',
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
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    margin: 20,
    maxWidth: width - 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 10,
  },
  modalDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 20,
  },
  modalRewards: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  modalRewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalRewardText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  modalRarity: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalRarityText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  modalUnlocked: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#e8f5e8',
    borderRadius: 15,
  },
  modalUnlockedText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginTop: 10,
  },
  modalUnlockedDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  modalLocked: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
    borderRadius: 15,
  },
  modalLockedText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#9E9E9E',
    marginTop: 10,
  },
  modalPrice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  modalPriceText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFD700',
    marginLeft: 10,
  },
  modalCategory: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalCategoryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  modalPurchased: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#e8f5e8',
    borderRadius: 15,
  },
  modalPurchasedText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginTop: 10,
  },
  modalBuyButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
  },
  modalBuyButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default GamificationScreen;
