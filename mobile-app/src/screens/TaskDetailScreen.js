import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, Modal, Dimensions, Share, Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useTasks } from '../contexts/TaskContext';
import { useGamification } from '../contexts/GamificationContext';

const { width } = Dimensions.get('window');

const TaskDetailScreen = ({ navigation, route }) => {
  const { getTask, updateTaskStatus, deleteTask } = useTasks();
  const { profile, triggerTaskEvent } = useGamification();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const { taskId } = route.params;

  useEffect(() => {
    loadTask();
  }, [taskId]);

  const loadTask = async () => {
    try {
      setLoading(true);
      const taskData = await getTask(taskId);
      setTask(taskData);
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось загрузить задачу');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await updateTaskStatus(taskId, newStatus);
      await triggerTaskEvent('task_status_changed', { status: newStatus });
      setTask(prev => ({ ...prev, status: newStatus }));
      setShowStatusModal(false);
      Alert.alert('Успех', 'Статус задачи обновлен');
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось обновить статус');
    }
  };

  const handleDeleteTask = async () => {
    try {
      await deleteTask(taskId);
      await triggerTaskEvent('task_deleted');
      setShowDeleteModal(false);
      Alert.alert('Успех', 'Задача удалена');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось удалить задачу');
    }
  };

  const handleShare = async () => {
    try {
      const shareMessage = `Задача: ${task.title}\n\nОписание: ${task.description}\n\nСтатус: ${getStatusText(task.status)}\nПриоритет: ${getPriorityText(task.priority)}\n\nТеги: ${task.tags.join(', ')}`;
      
      if (Platform.OS === 'ios') {
        await Share.share({
          message: shareMessage,
          title: task.title,
        });
      } else {
        await Share.share({
          message: shareMessage,
        });
      }
      setShowShareModal(false);
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось поделиться задачей');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'created': return '#FF9800';
      case 'in_progress': return '#2196F3';
      case 'completed': return '#4CAF50';
      default: return '#9E9E9E';
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

  const getStatusIcon = (status) => {
    switch (status) {
      case 'created': return 'schedule';
      case 'in_progress': return 'play-circle-outline';
      case 'completed': return 'check-circle';
      default: return 'help';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 1: return 'arrow-downward';
      case 2: return 'remove';
      case 3: return 'arrow-upward';
      case 4: return 'warning';
      case 5: return 'error';
      default: return 'help';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Загрузка задачи...</Text>
      </View>
    );
  }

  if (!task) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Задача не найдена</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Назад</Text>
        </TouchableOpacity>
      </View>
    );
  }

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
            <Text style={styles.modalTitle}>Изменить статус</Text>
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
                  task.status === option.status && styles.statusOptionActive
                ]}
                onPress={() => handleStatusChange(option.status)}
              >
                <Icon name={option.icon} size={24} color={option.color} />
                <Text style={[
                  styles.statusOptionText,
                  task.status === option.status && styles.statusOptionTextActive
                ]}>
                  {option.label}
                </Text>
                {task.status === option.status && (
                  <Icon name="check" size={20} color="#4CAF50" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );

  const DeleteModal = () => (
    <Modal
      visible={showDeleteModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowDeleteModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.deleteModal}>
          <Icon name="warning" size={48} color="#F44336" style={styles.deleteIcon} />
          <Text style={styles.deleteTitle}>Удалить задачу?</Text>
          <Text style={styles.deleteMessage}>
            Эта операция не может быть отменена. Задача будет удалена навсегда.
          </Text>
          
          <View style={styles.deleteActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowDeleteModal(false)}
            >
              <Text style={styles.cancelButtonText}>Отмена</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleDeleteTask}
            >
              <Text style={styles.deleteButtonText}>Удалить</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const ShareModal = () => (
    <Modal
      visible={showShareModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowShareModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.shareModal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Поделиться задачей</Text>
            <TouchableOpacity onPress={() => setShowShareModal(false)}>
              <Icon name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.shareContent}>
            <Text style={styles.sharePreview}>
              {task.title}
            </Text>
            <Text style={styles.shareDescription}>
              {task.description}
            </Text>
            
            <View style={styles.shareInfo}>
              <View style={styles.shareInfoRow}>
                <Text style={styles.shareInfoLabel}>Статус:</Text>
                <View style={[styles.shareInfoBadge, { backgroundColor: getStatusColor(task.status) }]}>
                  <Text style={styles.shareInfoBadgeText}>{getStatusText(task.status)}</Text>
                </View>
              </View>
              
              <View style={styles.shareInfoRow}>
                <Text style={styles.shareInfoLabel}>Приоритет:</Text>
                <View style={[styles.shareInfoBadge, { backgroundColor: getPriorityColor(task.priority) }]}>
                  <Text style={styles.shareInfoBadgeText}>{getPriorityText(task.priority)}</Text>
                </View>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={styles.shareButton}
            onPress={handleShare}
          >
            <LinearGradient
              colors={['#4CAF50', '#45a049']}
              style={styles.shareButtonGradient}
            >
              <Icon name="share" size={20} color="#fff" />
              <Text style={styles.shareButtonText}>Поделиться</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerAction}
            onPress={() => setShowShareModal(true)}
          >
            <Icon name="share" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerAction}
            onPress={() => navigation.navigate('TaskForm', { taskId: task.id })}
          >
            <Icon name="edit" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerAction}
            onPress={() => setShowDeleteModal(true)}
          >
            <Icon name="delete" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.taskHeader}>
          <Text style={styles.taskTitle}>{task.title}</Text>
          
          <View style={styles.taskMeta}>
            <View style={styles.metaItem}>
              <Icon name="schedule" size={16} color="#666" />
              <Text style={styles.metaText}>
                Создано: {new Date(task.created_at).toLocaleDateString()}
              </Text>
            </View>
            
            {task.due_date && (
              <View style={styles.metaItem}>
                <Icon name="event" size={16} color="#666" />
                <Text style={styles.metaText}>
                  Срок: {new Date(task.due_date).toLocaleDateString()}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.statusSection}>
          <TouchableOpacity
            style={styles.statusCard}
            onPress={() => setShowStatusModal(true)}
          >
            <LinearGradient
              colors={[getStatusColor(task.status), getStatusColor(task.status) + 'CC']}
              style={styles.statusGradient}
            >
              <Icon name={getStatusIcon(task.status)} size={32} color="#fff" />
              <View style={styles.statusInfo}>
                <Text style={styles.statusLabel}>Статус</Text>
                <Text style={styles.statusValue}>{getStatusText(task.status)}</Text>
              </View>
              <Icon name="edit" size={20} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.priorityCard}>
            <LinearGradient
              colors={[getPriorityColor(task.priority), getPriorityColor(task.priority) + 'CC']}
              style={styles.priorityGradient}
            >
              <Icon name={getPriorityIcon(task.priority)} size={32} color="#fff" />
              <View style={styles.priorityInfo}>
                <Text style={styles.priorityLabel}>Приоритет</Text>
                <Text style={styles.priorityValue}>{getPriorityText(task.priority)}</Text>
              </View>
            </LinearGradient>
          </View>
        </View>

        {task.description && (
          <View style={styles.descriptionSection}>
            <Text style={styles.sectionTitle}>Описание</Text>
            <Text style={styles.descriptionText}>{task.description}</Text>
          </View>
        )}

        {task.tags && task.tags.length > 0 && (
          <View style={styles.tagsSection}>
            <Text style={styles.sectionTitle}>Теги</Text>
            <View style={styles.tagsContainer}>
              {task.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>#{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Действия</Text>
          
          <View style={styles.actionButtons}>
            {task.status !== 'completed' && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleStatusChange('completed')}
              >
                <LinearGradient
                  colors={['#4CAF50', '#45a049']}
                  style={styles.actionButtonGradient}
                >
                  <Icon name="check-circle" size={20} color="#fff" />
                  <Text style={styles.actionButtonText}>Завершить</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}

            {task.status === 'created' && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleStatusChange('in_progress')}
              >
                <LinearGradient
                  colors={['#2196F3', '#1976D2']}
                  style={styles.actionButtonGradient}
                >
                  <Icon name="play-circle-outline" size={20} color="#fff" />
                  <Text style={styles.actionButtonText}>Начать работу</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}

            {task.status === 'in_progress' && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleStatusChange('created')}
              >
                <LinearGradient
                  colors={['#FF9800', '#F57C00']}
                  style={styles.actionButtonGradient}
                >
                  <Icon name="pause-circle-outline" size={20} color="#fff" />
                  <Text style={styles.actionButtonText}>Приостановить</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Информация</Text>
          
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Icon name="update" size={20} color="#666" />
              <Text style={styles.infoLabel}>Обновлено</Text>
              <Text style={styles.infoValue}>
                {new Date(task.updated_at || task.created_at).toLocaleDateString()}
              </Text>
            </View>
            
            <View style={styles.infoItem}>
              <Icon name="label" size={20} color="#666" />
              <Text style={styles.infoLabel}>Тегов</Text>
              <Text style={styles.infoValue}>{task.tags?.length || 0}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <StatusModal />
      <DeleteModal />
      <ShareModal />
    </View>
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
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#4CAF50',
  },
  backButton: {
    padding: 8,
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerAction: {
    padding: 8,
    marginLeft: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  taskHeader: {
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
  taskTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    lineHeight: 32,
  },
  taskMeta: {
    gap: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  statusSection: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statusCard: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  statusGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  statusInfo: {
    flex: 1,
    marginLeft: 12,
  },
  statusLabel: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.8,
  },
  statusValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  priorityCard: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  priorityGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  priorityInfo: {
    flex: 1,
    marginLeft: 12,
  },
  priorityLabel: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.8,
  },
  priorityValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  descriptionSection: {
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
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  tagsSection: {
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
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
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
  },
  actionsSection: {
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
  actionButtons: {
    gap: 12,
  },
  actionButton: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  infoSection: {
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
  infoGrid: {
    flexDirection: 'row',
    gap: 20,
  },
  infoItem: {
    alignItems: 'center',
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusModal: {
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
  deleteModal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 30,
    width: width * 0.9,
    maxWidth: 400,
    alignItems: 'center',
  },
  deleteIcon: {
    marginBottom: 16,
  },
  deleteTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  deleteMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  deleteActions: {
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
  deleteButton: {
    backgroundColor: '#F44336',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  deleteButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  shareModal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: width * 0.9',
    maxWidth: 400,
  },
  shareContent: {
    padding: 20,
  },
  sharePreview: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  shareDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 20,
  },
  shareInfo: {
    gap: 12,
  },
  shareInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  shareInfoLabel: {
    fontSize: 14,
    color: '#666',
  },
  shareInfoBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  shareInfoBadgeText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  shareButton: {
    margin: 20,
    borderRadius: 8,
    overflow: 'hidden',
  },
  shareButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  shareButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default TaskDetailScreen;
