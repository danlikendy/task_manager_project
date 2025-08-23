import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, Modal, Dimensions, ActivityIndicator,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTasks } from '../contexts/TaskContext';
import { useGamification } from '../contexts/GamificationContext';

const { width } = Dimensions.get('window');

const AIScreen = ({ navigation }) => {
  const { createTask } = useTasks();
  const { profile, triggerTaskEvent } = useGamification();
  const [loading, setLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState(null);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [activeFeature, setActiveFeature] = useState(null);

  const [inputText, setInputText] = useState('');
  const [featureInputs, setFeatureInputs] = useState({
    createTask: '',
    generateSubtasks: '',
    insights: '',
    dailyPlan: '',
    smartReminder: '',
  });

  const API_BASE_URL = 'http://localhost:8000';

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

  const callAIEndpoint = async (endpoint, data) => {
    try {
      setLoading(true);
      const headers = await getAuthHeaders();
      
      const response = await fetch(`${API_BASE_URL}/ai/${endpoint}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const result = await response.json();
        return result;
      } else {
        throw new Error('AI request failed');
      }
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async () => {
    if (!featureInputs.createTask.trim()) {
      Alert.alert('Ошибка', 'Введите описание задачи');
      return;
    }

    try {
      const result = await callAIEndpoint('create-task', {
        text: featureInputs.createTask,
      });

      setAiResponse({
        type: 'createTask',
        data: result,
        input: featureInputs.createTask,
      });
      setShowResponseModal(true);
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось создать задачу с помощью AI');
    }
  };

  const handleGenerateSubtasks = async () => {
    if (!featureInputs.generateSubtasks.trim()) {
      Alert.alert('Ошибка', 'Введите описание основной задачи');
      return;
    }

    try {
      const result = await callAIEndpoint('generate-subtasks', {
        text: featureInputs.generateSubtasks,
      });

      setAiResponse({
        type: 'generateSubtasks',
        data: result,
        input: featureInputs.generateSubtasks,
      });
      setShowResponseModal(true);
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось сгенерировать подзадачи');
    }
  };

  const handleGetInsights = async () => {
    try {
      const result = await callAIEndpoint('insights', {});

      setAiResponse({
        type: 'insights',
        data: result,
        input: null,
      });
      setShowResponseModal(true);
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось получить инсайты');
    }
  };

  const handleGetDailyPlan = async () => {
    try {
      const result = await callAIEndpoint('daily-plan', {});

      setAiResponse({
        type: 'dailyPlan',
        data: result,
        input: null,
      });
      setShowResponseModal(true);
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось получить ежедневный план');
    }
  };

  const handleGetSmartReminder = async () => {
    if (!featureInputs.smartReminder.trim()) {
      Alert.alert('Ошибка', 'Введите контекст для напоминания');
      return;
    }

    try {
      const result = await callAIEndpoint('smart-reminder', {
        text: featureInputs.smartReminder,
      });

      setAiResponse({
        type: 'smartReminder',
        data: result,
        input: featureInputs.smartReminder,
      });
      setShowResponseModal(true);
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось получить умное напоминание');
    }
  };

  const createTaskFromAI = async (taskData) => {
    try {
      const newTask = await createTask({
        title: taskData.title,
        description: taskData.description,
        priority: taskData.priority || 3,
        status: 'created',
        tags: taskData.tags || [],
      });

      await triggerTaskEvent('task_created');
      Alert.alert('Успех', 'Задача создана на основе AI-рекомендаций');
      setShowResponseModal(false);
      setFeatureInputs(prev => ({ ...prev, createTask: '' }));
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось создать задачу');
    }
  };

  const createSubtasksFromAI = async (subtasks) => {
    try {
      for (const subtask of subtasks) {
        await createTask({
          title: subtask.title,
          description: subtask.description,
          priority: subtask.priority || 3,
          status: 'created',
          tags: subtask.tags || [],
        });
      }

      await triggerTaskEvent('task_created');
      Alert.alert('Успех', `${subtasks.length} подзадач создано`);
      setShowResponseModal(false);
      setFeatureInputs(prev => ({ ...prev, generateSubtasks: '' }));
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось создать подзадачи');
    }
  };

  const AIFeatureCard = ({ title, description, icon, color, onPress, inputKey, placeholder, onSubmit }) => (
    <View style={styles.featureCard}>
      <LinearGradient
        colors={[color, color + 'CC']}
        style={styles.featureGradient}
      >
        <Icon name={icon} size={32} color="#fff" />
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDescription}>{description}</Text>
      </LinearGradient>

      <View style={styles.featureInput}>
        <TextInput
          style={styles.textInput}
          value={featureInputs[inputKey]}
          onChangeText={(text) => setFeatureInputs(prev => ({ ...prev, [inputKey]: text }))}
          placeholder={placeholder}
          placeholderTextColor="#999"
          multiline={inputKey === 'createTask' || inputKey === 'generateSubtasks'}
          numberOfLines={inputKey === 'createTask' || inputKey === 'generateSubtasks' ? 3 : 1}
        />
        <TouchableOpacity
          style={[styles.featureButton, { backgroundColor: color }]}
          onPress={onSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Icon name="send" size={20} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  const ResponseModal = () => (
    <Modal
      visible={showResponseModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowResponseModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.responseModal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>AI-рекомендации</Text>
            <TouchableOpacity onPress={() => setShowResponseModal(false)}>
              <Icon name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {aiResponse && (
              <>
                {aiResponse.input && (
                  <View style={styles.inputSection}>
                    <Text style={styles.inputLabel}>Ваш запрос:</Text>
                    <Text style={styles.inputText}>{aiResponse.input}</Text>
                  </View>
                )}

                {aiResponse.type === 'createTask' && (
                  <View style={styles.responseSection}>
                    <Text style={styles.responseTitle}>AI предлагает создать задачу:</Text>
                    <View style={styles.taskSuggestion}>
                      <Text style={styles.taskTitle}>{aiResponse.data.title}</Text>
                      <Text style={styles.taskDescription}>{aiResponse.data.description}</Text>
                      <View style={styles.taskMeta}>
                        <Text style={styles.taskMetaText}>
                          Приоритет: {aiResponse.data.priority}
                        </Text>
                        {aiResponse.data.tags && aiResponse.data.tags.length > 0 && (
                          <Text style={styles.taskMetaText}>
                            Теги: {aiResponse.data.tags.join(', ')}
                          </Text>
                        )}
                      </View>
                    </View>
                    <TouchableOpacity
                      style={styles.createButton}
                      onPress={() => createTaskFromAI(aiResponse.data)}
                    >
                      <LinearGradient
                        colors={['#4CAF50', '#45a049']}
                        style={styles.createButtonGradient}
                      >
                        <Text style={styles.createButtonText}>Создать задачу</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                )}

                {aiResponse.type === 'generateSubtasks' && (
                  <View style={styles.responseSection}>
                    <Text style={styles.responseTitle}>AI предлагает подзадачи:</Text>
                    {aiResponse.data.subtasks.map((subtask, index) => (
                      <View key={index} style={styles.subtaskSuggestion}>
                        <Text style={styles.subtaskTitle}>{subtask.title}</Text>
                        <Text style={styles.subtaskDescription}>{subtask.description}</Text>
                      </View>
                    ))}
                    <TouchableOpacity
                      style={styles.createButton}
                      onPress={() => createSubtasksFromAI(aiResponse.data.subtasks)}
                    >
                      <LinearGradient
                        colors={['#4CAF50', '#45a049']}
                        style={styles.createButtonGradient}
                      >
                        <Text style={styles.createButtonText}>Создать все подзадачи</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                )}

                {aiResponse.type === 'insights' && (
                  <View style={styles.responseSection}>
                    <Text style={styles.responseTitle}>Ваши инсайты продуктивности:</Text>
                    <Text style={styles.insightText}>{aiResponse.data.insights}</Text>
                    <View style={styles.insightStats}>
                      <Text style={styles.insightStat}>
                        Завершено задач: {aiResponse.data.completed_tasks}
                      </Text>
                      <Text style={styles.insightStat}>
                        Средний приоритет: {aiResponse.data.avg_priority}
                      </Text>
                      <Text style={styles.insightStat}>
                        Популярные теги: {aiResponse.data.popular_tags?.join(', ')}
                      </Text>
                    </View>
                  </View>
                )}

                {aiResponse.type === 'dailyPlan' && (
                  <View style={styles.responseSection}>
                    <Text style={styles.responseTitle}>Ежедневный план от AI:</Text>
                    <Text style={styles.planText}>{aiResponse.data.plan}</Text>
                    <View style={styles.planTasks}>
                      <Text style={styles.planTasksTitle}>Рекомендуемые задачи:</Text>
                      {aiResponse.data.suggested_tasks?.map((task, index) => (
                        <View key={index} style={styles.planTask}>
                          <Text style={styles.planTaskTitle}>{task.title}</Text>
                          <Text style={styles.planTaskPriority}>
                            Приоритет: {task.priority}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {aiResponse.type === 'smartReminder' && (
                  <View style={styles.responseSection}>
                    <Text style={styles.responseTitle}>Умное напоминание:</Text>
                    <Text style={styles.reminderText}>{aiResponse.data.reminder}</Text>
                    {aiResponse.data.suggested_actions && (
                      <View style={styles.reminderActions}>
                        <Text style={styles.reminderActionsTitle}>Рекомендуемые действия:</Text>
                        {aiResponse.data.suggested_actions.map((action, index) => (
                          <Text key={index} style={styles.reminderAction}>
                            • {action}
                          </Text>
                        ))}
                      </View>
                    )}
                  </View>
                )}
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <LinearGradient
          colors={['#9C27B0', '#7B1FA2']}
          style={styles.headerGradient}
        >
          <Icon name="smart-toy" size={32} color="#fff" />
          <Text style={styles.headerTitle}>AI-ассистент</Text>
          <Text style={styles.headerSubtitle}>
            Умный помощник для повышения продуктивности
          </Text>
        </LinearGradient>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.featuresGrid}>
          <AIFeatureCard
            title="Создать задачу"
            description="AI поможет создать задачу на основе вашего описания"
            icon="add-task"
            color="#4CAF50"
            inputKey="createTask"
            placeholder="Опишите, что нужно сделать..."
            onSubmit={handleCreateTask}
          />

          <AIFeatureCard
            title="Генерировать подзадачи"
            description="Разбейте большую задачу на подзадачи"
            icon="account-tree"
            color="#2196F3"
            inputKey="generateSubtasks"
            placeholder="Опишите основную задачу..."
            onSubmit={handleGenerateSubtasks}
          />

          <TouchableOpacity
            style={styles.featureCard}
            onPress={handleGetInsights}
            disabled={loading}
          >
            <LinearGradient
              colors={['#FF9800', '#F57C00']}
              style={styles.featureGradient}
            >
              <Icon name="analytics" size={32} color="#fff" />
              <Text style={styles.featureTitle}>Анализ продуктивности</Text>
              <Text style={styles.featureDescription}>
                Получите инсайты о вашей работе
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.featureCard}
            onPress={handleGetDailyPlan}
            disabled={loading}
          >
            <LinearGradient
              colors={['#9C27B0', '#7B1FA2']}
              style={styles.featureGradient}
            >
              <Icon name="schedule" size={32} color="#fff" />
              <Text style={styles.featureTitle}>Ежедневный план</Text>
              <Text style={styles.featureDescription}>
                AI составит план на день
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <AIFeatureCard
            title="Умные напоминания"
            description="Получите персонализированные напоминания"
            icon="notifications-active"
            color="#E91E63"
            inputKey="smartReminder"
            placeholder="О чем напомнить?"
            onSubmit={handleGetSmartReminder}
          />
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Как работает AI-ассистент?</Text>
          <View style={styles.infoItems}>
            <View style={styles.infoItem}>
              <Icon name="psychology" size={20} color="#4CAF50" />
              <Text style={styles.infoText}>
                Анализирует ваши задачи и привычки
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Icon name="lightbulb" size={20} color="#FF9800" />
              <Text style={styles.infoText}>
                Предлагает оптимальные решения
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Icon name="trending-up" size={20} color="#2196F3" />
              <Text style={styles.infoText}>
                Помогает повысить продуктивность
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <ResponseModal />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    borderRadius: 0,
    overflow: 'hidden',
  },
  headerGradient: {
    padding: 24,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 12,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  featuresGrid: {
    gap: 16,
  },
  featureCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  featureGradient: {
    padding: 20,
    alignItems: 'center',
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  featureDescription: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    textAlign: 'center',
    lineHeight: 20,
  },
  featureInput: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'flex-end',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#fff',
    marginRight: 12,
    minHeight: 40,
  },
  featureButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  infoItems: {
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 12,
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  responseModal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: width * 0.95,
    maxWidth: 500,
    maxHeight: '80%',
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
  modalContent: {
    padding: 20,
  },
  inputSection: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 8,
  },
  inputText: {
    fontSize: 14,
    color: '#333',
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    lineHeight: 20,
  },
  responseSection: {
    gap: 16,
  },
  responseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  taskSuggestion: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  taskDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  taskMeta: {
    gap: 4,
  },
  taskMetaText: {
    fontSize: 12,
    color: '#999',
  },
  subtaskSuggestion: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  subtaskTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  subtaskDescription: {
    fontSize: 12,
    color: '#666',
  },
  insightText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 16,
  },
  insightStats: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  insightStat: {
    fontSize: 14,
    color: '#666',
  },
  planText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 16,
  },
  planTasks: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
  },
  planTasksTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  planTask: {
    marginBottom: 8,
  },
  planTaskTitle: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  planTaskPriority: {
    fontSize: 12,
    color: '#666',
  },
  reminderText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 16,
  },
  reminderActions: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
  },
  reminderActionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  reminderAction: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  createButton: {
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 16,
  },
  createButtonGradient: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AIScreen;
