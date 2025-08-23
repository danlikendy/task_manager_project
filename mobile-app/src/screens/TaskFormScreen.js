import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, Modal, Dimensions, KeyboardAvoidingView,
  Platform, ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import DateTimePicker from 'react-native-date-picker';
import { useTasks } from '../contexts/TaskContext';
import { useGamification } from '../contexts/GamificationContext';

const { width } = Dimensions.get('window');

const TaskFormScreen = ({ navigation, route }) => {
  const { createTask, updateTask, getTask } = useTasks();
  const { profile, triggerTaskEvent } = useGamification();
  const [loading, setLoading] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showPriorityModal, setShowPriorityModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 3,
    status: 'created',
    tags: [],
    due_date: null,
  });

  const [errors, setErrors] = useState({});
  const [newTag, setNewTag] = useState('');

  const { taskId } = route.params || {};

  useEffect(() => {
    if (taskId) {
      loadTask();
      setIsEdit(true);
    }
  }, [taskId]);

  const loadTask = async () => {
    try {
      setLoading(true);
      const task = await getTask(taskId);
      setFormData({
        title: task.title || '',
        description: task.description || '',
        priority: task.priority || 3,
        status: task.status || 'created',
        tags: task.tags || [],
        due_date: task.due_date ? new Date(task.due_date) : null,
      });
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось загрузить задачу');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Название обязательно';
    }

    if (formData.title.length > 100) {
      newErrors.title = 'Название не должно превышать 100 символов';
    }

    if (formData.description && formData.description.length > 1000) {
      newErrors.description = 'Описание не должно превышать 1000 символов';
    }

    if (formData.due_date && formData.due_date < new Date()) {
      newErrors.due_date = 'Срок не может быть в прошлом';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      const taskData = {
        ...formData,
        due_date: formData.due_date ? formData.due_date.toISOString() : null,
      };

      if (isEdit) {
        await updateTask(taskId, taskData);
        await triggerTaskEvent('task_updated');
        Alert.alert('Успех', 'Задача обновлена');
      } else {
        await createTask(taskData);
        await triggerTaskEvent('task_created');
        Alert.alert('Успех', 'Задача создана');
      }

      navigation.goBack();
    } catch (error) {
      Alert.alert('Ошибка', `Не удалось ${isEdit ? 'обновить' : 'создать'} задачу`);
    } finally {
      setLoading(false);
    }
  };

  const handleAIAssistant = async () => {
    if (!formData.title.trim()) {
      Alert.alert('Ошибка', 'Сначала введите название задачи');
      return;
    }

    try {
      setAiLoading(true);
      setShowAIModal(true);

      const response = await fetch('http://localhost:8000/ai/create-task', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${profile?.token}`,
        },
        body: JSON.stringify({
          text: formData.title + (formData.description ? '\n' + formData.description : ''),
        }),
      });

      if (response.ok) {
        const aiData = await response.json();
        
        setFormData(prev => ({
          ...prev,
          description: aiData.description || prev.description,
          priority: aiData.priority || prev.priority,
          tags: aiData.tags || prev.tags,
        }));

        Alert.alert('AI-ассистент', 'Задача улучшена с помощью AI!');
      } else {
        Alert.alert('AI-ассистент', 'Не удалось получить рекомендации от AI');
      }
    } catch (error) {
      Alert.alert('AI-ассистент', 'Ошибка при обращении к AI-ассистенту');
    } finally {
      setAiLoading(false);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove),
    }));
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 1: return '#4CAF50';
      case 2: return '#8BC34A';
      case 3: return '#FFC107';
      case 4: return '#FF9800';
      case 5: return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const getPriorityText = (priority) => {
    switch (priority) {
      case 1: return 'Низкий';
      case 2: return 'Средний';
      case 3: return 'Высокий';
      case 4: return 'Срочный';
      case 5: return 'Критический';
      default: return 'Неизвестно';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'created': return 'Создано';
      case 'in_progress': return 'В работе';
      case 'completed': return 'Завершено';
      default: return 'Неизвестно';
    }
  };

  const PriorityModal = () => (
    <Modal
      visible={showPriorityModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowPriorityModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.priorityModal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Выберите приоритет</Text>
            <TouchableOpacity onPress={() => setShowPriorityModal(false)}>
              <Icon name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.priorityOptions}>
            {[1, 2, 3, 4, 5].map(priority => (
              <TouchableOpacity
                key={priority}
                style={[
                  styles.priorityOption,
                  formData.priority === priority && styles.priorityOptionActive
                ]}
                onPress={() => {
                  setFormData(prev => ({ ...prev, priority }));
                  setShowPriorityModal(false);
                }}
              >
                <View style={[styles.priorityIndicator, { backgroundColor: getPriorityColor(priority) }]} />
                <Text style={[
                  styles.priorityOptionText,
                  formData.priority === priority && styles.priorityOptionTextActive
                ]}>
                  {getPriorityText(priority)}
                </Text>
                {formData.priority === priority && (
                  <Icon name="check" size={20} color="#4CAF50" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );

  const StatusModal = () => (
    <Modal
      visible={showStatusModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowStatusModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.statusModal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Выберите статус</Text>
            <TouchableOpacity onPress={() => setShowStatusModal(false)}>
              <Icon name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.statusOptions}>
            {[
              { status: 'created', label: 'Создано', icon: 'schedule', color: '#FF9800' },
              { status: 'in_progress', label: 'В работе', icon: 'play-circle-outline', color: '#2196F3' },
              { status: 'completed', label: 'Завершено', icon: 'check-circle', color: '#4CAF50' }
            ].map(option => (
              <TouchableOpacity
                key={option.status}
                style={[
                  styles.statusOption,
                  formData.status === option.status && styles.statusOptionActive
                ]}
                onPress={() => {
                  setFormData(prev => ({ ...prev, status: option.status }));
                  setShowStatusModal(false);
                }}
              >
                <Icon name={option.icon} size={24} color={option.color} />
                <Text style={[
                  styles.statusOptionText,
                  formData.status === option.status && styles.statusOptionTextActive
                ]}>
                  {option.label}
                </Text>
                {formData.status === option.status && (
                  <Icon name="check" size={20} color="#4CAF50" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );

  const AIModal = () => (
    <Modal
      visible={showAIModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowAIModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.aiModal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>AI-ассистент</Text>
            <TouchableOpacity onPress={() => setShowAIModal(false)}>
              <Icon name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.aiContent}>
            {aiLoading ? (
              <View style={styles.aiLoading}>
                <ActivityIndicator size="large" color="#4CAF50" />
                <Text style={styles.aiLoadingText}>AI анализирует задачу...</Text>
              </View>
            ) : (
              <View style={styles.aiSuggestions}>
                <Text style={styles.aiTitle}>Рекомендации AI:</Text>
                
                {formData.description && (
                  <View style={styles.aiSuggestion}>
                    <Icon name="description" size={20} color="#4CAF50" />
                    <Text style={styles.aiSuggestionText}>
                      Описание: {formData.description}
                    </Text>
                  </View>
                )}
                
                <View style={styles.aiSuggestion}>
                  <Icon name="priority-high" size={20} color="#FF9800" />
                  <Text style={styles.aiSuggestionText}>
                    Приоритет: {getPriorityText(formData.priority)}
                  </Text>
                </View>
                
                {formData.tags.length > 0 && (
                  <View style={styles.aiSuggestion}>
                    <Icon name="label" size={20} color="#2196F3" />
                    <Text style={styles.aiSuggestionText}>
                      Теги: {formData.tags.join(', ')}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Загрузка...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>
          {isEdit ? 'Редактировать задачу' : 'Новая задача'}
        </Text>
        
        <TouchableOpacity
          style={styles.aiButton}
          onPress={handleAIAssistant}
        >
          <Icon name="smart-toy" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Основная информация</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Название *</Text>
            <TextInput
              style={[styles.textInput, errors.title && styles.inputError]}
              value={formData.title}
              onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))}
              placeholder="Введите название задачи"
              placeholderTextColor="#999"
              maxLength={100}
            />
            {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Описание</Text>
            <TextInput
              style={[styles.textArea, errors.description && styles.inputError]}
              value={formData.description}
              onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
              placeholder="Введите описание задачи"
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
              maxLength={1000}
            />
            {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
          </View>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Настройки</Text>
          
          <TouchableOpacity
            style={styles.selectorButton}
            onPress={() => setShowPriorityModal(true)}
          >
            <View style={styles.selectorContent}>
              <View style={styles.selectorLeft}>
                <Icon name="priority-high" size={20} color="#666" />
                <Text style={styles.selectorLabel}>Приоритет</Text>
              </View>
              <View style={styles.selectorRight}>
                <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(formData.priority) }]}>
                  <Text style={styles.priorityBadgeText}>{getPriorityText(formData.priority)}</Text>
                </View>
                <Icon name="chevron-right" size={20} color="#666" />
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.selectorButton}
            onPress={() => setShowStatusModal(true)}
          >
            <View style={styles.selectorContent}>
              <View style={styles.selectorLeft}>
                <Icon name="flag" size={20} color="#666" />
                <Text style={styles.selectorLabel}>Статус</Text>
              </View>
              <View style={styles.selectorRight}>
                <Text style={styles.selectorValue}>{getStatusText(formData.status)}</Text>
                <Icon name="chevron-right" size={20} color="#666" />
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.selectorButton}
            onPress={() => setShowDatePicker(true)}
          >
            <View style={styles.selectorContent}>
              <View style={styles.selectorLeft}>
                <Icon name="event" size={20} color="#666" />
                <Text style={styles.selectorLabel}>Срок выполнения</Text>
              </View>
              <View style={styles.selectorRight}>
                <Text style={styles.selectorValue}>
                  {formData.due_date ? formData.due_date.toLocaleDateString() : 'Не установлен'}
                </Text>
                <Icon name="chevron-right" size={20} color="#666" />
              </View>
            </View>
          </TouchableOpacity>
          {errors.due_date && <Text style={styles.errorText}>{errors.due_date}</Text>}
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Теги</Text>
          
          <View style={styles.tagsInputContainer}>
            <TextInput
              style={styles.tagInput}
              value={newTag}
              onChangeText={setNewTag}
              placeholder="Добавить тег"
              placeholderTextColor="#999"
              onSubmitEditing={addTag}
            />
            <TouchableOpacity
              style={styles.addTagButton}
              onPress={addTag}
            >
              <Icon name="add" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          {formData.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {formData.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>#{tag}</Text>
                  <TouchableOpacity
                    style={styles.removeTagButton}
                    onPress={() => removeTag(tag)}
                  >
                    <Icon name="close" size={16} color="#666" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={loading}
        >
          <LinearGradient
            colors={['#4CAF50', '#45a049']}
            style={styles.submitButtonGradient}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>
                {isEdit ? 'Обновить' : 'Создать'}
              </Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <DateTimePicker
        modal
        open={showDatePicker}
        date={formData.due_date || new Date()}
        mode="date"
        onConfirm={(date) => {
          setFormData(prev => ({ ...prev, due_date: date }));
          setShowDatePicker(false);
        }}
        onCancel={() => setShowDatePicker(false)}
        minimumDate={new Date()}
      />

      <PriorityModal />
      <StatusModal />
      <AIModal />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#4CAF50',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    marginHorizontal: 16,
  },
  aiButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  formSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
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
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#fff',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#fff',
    textAlignVertical: 'top',
    minHeight: 100,
  },
  inputError: {
    borderColor: '#F44336',
  },
  errorText: {
    fontSize: 12,
    color: '#F44336',
    marginTop: 4,
  },
  selectorButton: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  selectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  selectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectorLabel: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  selectorRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectorValue: {
    fontSize: 16,
    color: '#666',
    marginRight: 8,
  },
  priorityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  priorityBadgeText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  tagsInputContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  tagInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#fff',
    marginRight: 12,
  },
  addTagButton: {
    backgroundColor: '#4CAF50',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  removeTagButton: {
    padding: 2,
  },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  submitButton: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  submitButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonText: {
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
  priorityModal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: width * 0.9,
    maxWidth: 400,
  },
  statusModal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: width * 0.9,
    maxWidth: 400,
  },
  aiModal: {
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
  priorityOptions: {
    padding: 20,
  },
  priorityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#f5f5f5',
  },
  priorityOptionActive: {
    backgroundColor: '#e8f5e8',
  },
  priorityIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  priorityOptionText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  priorityOptionTextActive: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  statusOptions: {
    padding: 20,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#f5f5f5',
  },
  statusOptionActive: {
    backgroundColor: '#e8f5e8',
  },
  statusOptionText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
    flex: 1,
  },
  statusOptionTextActive: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  aiContent: {
    padding: 20,
  },
  aiLoading: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  aiLoadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  aiSuggestions: {
    gap: 16,
  },
  aiTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  aiSuggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
  },
  aiSuggestionText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 12,
    flex: 1,
  },
});

export default TaskFormScreen;
