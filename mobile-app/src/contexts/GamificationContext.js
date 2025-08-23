import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const GamificationContext = createContext();

export const useGamification = () => {
  const context = useContext(GamificationContext);
  if (!context) {
    throw new Error('useGamification must be used within a GamificationProvider');
  }
  return context;
};

export const GamificationProvider = ({ children }) => {
  const [profile, setProfile] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const API_BASE_URL = 'http://localhost:8000';

  useEffect(() => {
    loadStoredGamification();
  }, []);

  const loadStoredGamification = async () => {
    try {
      const [storedProfile, storedAchievements, storedChallenges, storedRewards] = await Promise.all([
        AsyncStorage.getItem('gamificationProfile'),
        AsyncStorage.getItem('gamificationAchievements'),
        AsyncStorage.getItem('gamificationChallenges'),
        AsyncStorage.getItem('gamificationRewards'),
      ]);

      if (storedProfile) {
        setProfile(JSON.parse(storedProfile));
      }
      if (storedAchievements) {
        setAchievements(JSON.parse(storedAchievements));
      }
      if (storedChallenges) {
        setChallenges(JSON.parse(storedChallenges));
      }
      if (storedRewards) {
        setRewards(JSON.parse(storedRewards));
      }
    } catch (error) {
      console.error('Error loading stored gamification data:', error);
    }
  };

  const storeGamificationData = async (key, data) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`Error storing ${key}:`, error);
    }
  };

  const getAuthHeaders = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      };
    } catch (error) {
      console.error('Error getting auth headers:', error);
      return {
        'Content-Type': 'application/json',
      };
    }
  };

  const getProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/gamification/profile`, { headers });
      
      if (response.ok) {
        const profileData = await response.json();
        setProfile(profileData);
        await storeGamificationData('gamificationProfile', profileData);
        return profileData;
      } else {
        throw new Error('Failed to get profile');
      }
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getAchievements = async () => {
    try {
      setLoading(true);
      setError(null);

      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/gamification/achievements`, { headers });
      
      if (response.ok) {
        const achievementsData = await response.json();
        setAchievements(achievementsData);
        await storeGamificationData('gamificationAchievements', achievementsData);
        return achievementsData;
      } else {
        throw new Error('Failed to get achievements');
      }
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getChallenges = async () => {
    try {
      setLoading(true);
      setError(null);

      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/gamification/challenges`, { headers });
      
      if (response.ok) {
        const challengesData = await response.json();
        setChallenges(challengesData);
        await storeGamificationData('gamificationChallenges', challengesData);
        return challengesData;
      } else {
        throw new Error('Failed to get challenges');
      }
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getRewards = async () => {
    try {
      setLoading(true);
      setError(null);

      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/gamification/rewards`, { headers });
      
      if (response.ok) {
        const rewardsData = await response.json();
        setRewards(rewardsData);
        await storeGamificationData('gamificationRewards', rewardsData);
        return rewardsData;
      } else {
        throw new Error('Failed to get rewards');
      }
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateMood = async (mood) => {
    try {
      setError(null);

      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/gamification/mood`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ mood }),
      });

      if (response.ok) {
        const updatedProfile = await response.json();
        setProfile(updatedProfile);
        await storeGamificationData('gamificationProfile', updatedProfile);
        return updatedProfile;
      } else {
        throw new Error('Failed to update mood');
      }
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const purchaseReward = async (rewardId) => {
    try {
      setLoading(true);
      setError(null);

      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/gamification/rewards/${rewardId}/purchase`, {
        method: 'POST',
        headers,
      });

      if (response.ok) {
        const result = await response.json();
        
        if (result.success) {
          const updatedProfile = await getProfile();
          const updatedRewards = await getRewards();
          
          setProfile(updatedProfile);
          setRewards(updatedRewards);
          
          return result;
        } else {
          throw new Error(result.message || 'Failed to purchase reward');
        }
      } else {
        throw new Error('Failed to purchase reward');
      }
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const triggerTaskEvent = async (eventType, eventData = {}) => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/gamification/events`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          event_type: eventType,
          event_data: eventData,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        
        if (result.profile_updated) {
          await getProfile();
        }
        if (result.achievements_updated) {
          await getAchievements();
        }
        if (result.challenges_updated) {
          await getChallenges();
        }
        
        return result;
      }
    } catch (error) {
      console.error('Error triggering task event:', error);
    }
  };

  const getStats = async () => {
    try {
      setError(null);

      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/gamification/stats`, { headers });
      
      if (response.ok) {
        const statsData = await response.json();
        return statsData;
      } else {
        throw new Error('Failed to get statistics');
      }
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const refreshAllData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        getProfile(),
        getAchievements(),
        getChallenges(),
        getRewards(),
      ]);
    } catch (error) {
      console.error('Error refreshing gamification data:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  const calculateLevel = (xp) => {
    if (xp < 100) return 1;
    if (xp < 300) return 2;
    if (xp < 600) return 3;
    if (xp < 1000) return 4;
    if (xp < 1500) return 5;
    if (xp < 2100) return 6;
    if (xp < 2800) return 7;
    if (xp < 3600) return 8;
    if (xp < 4500) return 9;
    return 10;
  };

  const getLevelProgress = (xp) => {
    const level = calculateLevel(xp);
    let levelStart = 0;
    let levelEnd = 0;

    if (level === 1) {
      levelStart = 0;
      levelEnd = 100;
    } else if (level === 2) {
      levelStart = 100;
      levelEnd = 300;
    } else if (level === 3) {
      levelStart = 300;
      levelEnd = 600;
    } else if (level === 4) {
      levelStart = 600;
      levelEnd = 1000;
    } else if (level === 5) {
      levelStart = 1000;
      levelEnd = 1500;
    } else if (level === 6) {
      levelStart = 1500;
      levelEnd = 2100;
    } else if (level === 7) {
      levelStart = 2100;
      levelEnd = 2800;
    } else if (level === 8) {
      levelStart = 2800;
      levelEnd = 3600;
    } else if (level === 9) {
      levelStart = 3600;
      levelEnd = 4500;
    } else {
      levelStart = 4500;
      levelEnd = xp + 1000;
    }

    const progress = ((xp - levelStart) / (levelEnd - levelStart)) * 100;
    return Math.min(100, Math.max(0, progress));
  };

  const getNextLevelXP = (xp) => {
    const level = calculateLevel(xp);
    const levelThresholds = [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500];
    
    if (level >= 10) return xp;
    return levelThresholds[level];
  };

  const getUnlockedAchievements = () => {
    return achievements.filter(achievement => achievement.is_unlocked);
  };

  const getLockedAchievements = () => {
    return achievements.filter(achievement => !achievement.is_unlocked);
  };

  const getCompletedChallenges = () => {
    return challenges.filter(challenge => challenge.is_completed);
  };

  const getActiveChallenges = () => {
    return challenges.filter(challenge => !challenge.is_completed);
  };

  const getAvailableRewards = () => {
    return rewards.filter(reward => !reward.is_purchased && reward.cost <= (profile?.coins || 0));
  };

  const getPurchasedRewards = () => {
    return rewards.filter(reward => reward.is_purchased);
  };

  const value = {
    profile,
    achievements,
    challenges,
    rewards,
    loading,
    error,
    getProfile,
    getAchievements,
    getChallenges,
    getRewards,
    updateMood,
    purchaseReward,
    triggerTaskEvent,
    getStats,
    refreshAllData,
    clearError,
    calculateLevel,
    getLevelProgress,
    getNextLevelXP,
    getUnlockedAchievements,
    getLockedAchievements,
    getCompletedChallenges,
    getActiveChallenges,
    getAvailableRewards,
    getPurchasedRewards,
  };

  return (
    <GamificationContext.Provider value={value}>
      {children}
    </GamificationContext.Provider>
  );
};
