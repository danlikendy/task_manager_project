import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, RefreshControl, Alert, Modal, Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useTasks } from '../contexts/TaskContext';
import { useGamification } from '../contexts/GamificationContext';

const { width } = Dimensions.get('window');

const TasksScreen = ({ navigation, route }) => {
  const { tasks, getTasks, deleteTask, updateTaskStatus } = useTasks();
  const { profile, triggerTaskEvent } = useGamification();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [showFilters, setShowFilters] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (route.params?.createNew) {
      navigation.navigate('TaskForm');
    }
  }, [route.params]);

  const loadData = async () => {
    try {
      await getTasks();
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось загрузить задачи');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleDeleteTask = async (taskId) => {
    Alert.alert(
      'Удаление задачи',
      'Вы уверены, что хотите удалить эту задачу?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTask(taskId);
              await triggerTaskEvent('task_deleted');
              Alert.alert('Успех', 'Задача удалена');
            } catch (error) {
              Alert.alert('Ошибка', 'Не удалось удалить задачу');
            }
          },
        },
      ]
    );
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await updateTaskStatus(taskId, newStatus);
      await triggerTaskEvent('task_status_changed', { status: newStatus });
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось обновить статус');
    }
  };

  const getFilteredTasks = () => {
    let filtered = [...tasks];

    if (searchQuery) {
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(task => task.status === statusFilter);
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter(task => task.priority === priorityFilter);
    }

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'created_at':
          return new Date(b.created_at) - new Date(a.created_at);
        case 'due_date':
          return new Date(a.due_date || '9999-12-31') - new Date(b.due_date || '9999-12-31');
        case 'priority':
          return b.priority - a.priority;
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });
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

  const filteredTasks = getFilteredTasks();

  const TaskCard = ({ task }) => (
    <TouchableOpacity
      style={styles.taskCard}
      onPress={() => navigation.navigate('TaskDetail', { taskId: task.id })}
    >
      <View style={styles.taskHeader}>
        <View style={styles.taskTitleRow}>
          <Text style={styles.taskTitle} numberOfLines={2}>
            {task.title}
          </Text>
          <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(task.priority) }]}>
            <Text style={styles.priorityText}>{getPriorityText(task.priority)}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.moreButton}
          onPress={() => setShowSortMenu(true)}
        >
          <Icon name="more-vert" size={20} color="#666" />
        </TouchableOpacity>
      </View>

      {task.description && (
        <Text style={styles.taskDescription} numberOfLines={2}>
          {task.description}
        </Text>
      )}

      <View style={styles.taskMeta}>
        <View style={styles.taskTags}>
          {task.tags.slice(0, 3).map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>#{tag}</Text>
            </View>
          ))}
          {task.tags.length > 3 && (
            <Text style={styles.moreTags}>+{task.tags.length - 3}</Text>
          )}
        </View>

        {task.due_date && (
          <View style={styles.dueDate}>
            <Icon name="schedule" size={16} color="#666" />
            <Text style={styles.dueDateText}>
              {new Date(task.due_date).toLocaleDateString()}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.taskFooter}>
        <View style={styles.statusSection}>
          <Text style={styles.statusLabel}>Статус:</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(task.status) }]}>
            <Text style={styles.statusText}>{getStatusText(task.status)}</Text>
          </View>
        </View>

        <View style={styles.actionButtons}>
          {task.status !== 'completed' && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleStatusChange(task.id, 'completed')}
            >
              <Icon name="check-circle" size={20} color="#4CAF50" />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('TaskForm', { taskId: task.id })}
          >
            <Icon name="edit" size={20} color="#2196F3" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDeleteTask(task.id)}
          >
            <Icon name="delete" size={20} color="#F44336" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  const FilterModal = () => (
    <Modal
      visible={showFilters}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowFilters(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.filterModal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Фильтры и сортировка</Text>
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <Icon name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.filterContent}>
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Статус</Text>
              <View style={styles.filterOptions}>
                {['all', 'created', 'in_progress', 'completed'].map(status => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.filterOption,
                      statusFilter === status && styles.filterOptionActive
                    ]}
                    onPress={() => setStatusFilter(status)}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      statusFilter === status && styles.filterOptionTextActive
                    ]}>
                      {status === 'all' ? 'Все' : getStatusText(status)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Приоритет</Text>
              <View style={styles.filterOptions}>
                {['all', 1, 2, 3, 4, 5].map(priority => (
                  <TouchableOpacity
                    key={priority}
                    style={[
                      styles.filterOption,
                      priorityFilter === priority && styles.filterOptionActive
                    ]}
                    onPress={() => setPriorityFilter(priority)}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      priorityFilter === priority && styles.filterOptionTextActive
                    ]}>
                      {priority === 'all' ? 'Все' : getPriorityText(priority)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Сортировка</Text>
              <View style={styles.filterOptions}>
                {[
                  { value: 'created_at', label: 'По дате создания' },
                  { value: 'due_date', label: 'По сроку' },
                  { value: 'priority', label: 'По приоритету' },
                  { value: 'title', label: 'По названию' }
                ].map(sort => (
                  <TouchableOpacity
                    key={sort.value}
                    style={[
                      styles.filterOption,
                      sortBy === sort.value && styles.filterOptionActive
                    ]}
                    onPress={() => setSortBy(sort.value)}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      sortBy === sort.value && styles.filterOptionTextActive
                    ]}>
                      {sort.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.resetButton}
              onPress={() => {
                setStatusFilter('all');
                setPriorityFilter('all');
                setSortBy('created_at');
              }}
            >
              <Text style={styles.resetButtonText}>Сбросить</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.applyButton}
              onPress={() => setShowFilters(false)}
            >
              <Text style={styles.applyButtonText}>Применить</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Icon name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Поиск задач..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Icon name="clear" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFilters(true)}
          >
            <Icon name="filter-list" size={24} color="#4CAF50" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('TaskForm')}
          >
            <Icon name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{filteredTasks.length}</Text>
          <Text style={styles.statLabel}>Всего</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {filteredTasks.filter(t => t.status === 'completed').length}
          </Text>
          <Text style={styles.statLabel}>Завершено</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {filteredTasks.filter(t => t.status === 'in_progress').length}
          </Text>
          <Text style={styles.statLabel}>В работе</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {filteredTasks.filter(t => t.status === 'created').length}
          </Text>
          <Text style={styles.statLabel}>Создано</Text>
        </View>
      </View>

      <ScrollView
        style={styles.tasksList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {filteredTasks.length > 0 ? (
          filteredTasks.map(task => (
            <TaskCard key={task.id} task={task} />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Icon name="assignment" size={64} color="#ccc" />
            <Text style={styles.emptyStateTitle}>
              {searchQuery || statusFilter !== 'all' || priorityFilter !== 'all'
                ? 'Задачи не найдены'
                : 'Задачи отсутствуют'
              }
            </Text>
            <Text style={styles.emptyStateSubtitle}>
              {searchQuery || statusFilter !== 'all' || priorityFilter !== 'all'
                ? 'Попробуйте изменить фильтры или поиск'
                : 'Создайте свою первую задачу'
              }
            </Text>
            {!searchQuery && statusFilter === 'all' && priorityFilter === 'all' && (
              <TouchableOpacity
                style={styles.createFirstTaskButton}
                onPress={() => navigation.navigate('TaskForm')}
              >
                <LinearGradient
                  colors={['#4CAF50', '#45a049']}
                  style={styles.createFirstTaskGradient}
                >
                  <Text style={styles.createFirstTaskButtonText}>Создать задачу</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>

      <FilterModal />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 25,
    paddingHorizontal: 16,
    marginRight: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: '#333',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterButton: {
    padding: 8,
    marginRight: 8,
  },
  addButton: {
    backgroundColor: '#4CAF50',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  tasksList: {
    flex: 1,
    padding: 16,
  },
  taskCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  taskTitleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  moreButton: {
    padding: 4,
  },
  taskDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  taskMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  taskTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    flex: 1,
  },
  tag: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 12,
    color: '#666',
  },
  moreTags: {
    fontSize: 12,
    color: '#999',
    marginLeft: 4,
  },
  dueDate: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dueDateText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 12,
    color: '#666',
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  actionButtons: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 24,
  },
  createFirstTaskButton: {
    borderRadius: 25,
    overflow: 'hidden',
  },
  createFirstTaskGradient: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  createFirstTaskButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  filterModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
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
  filterContent: {
    padding: 20,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  filterOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    marginRight: 8,
    marginBottom: 8,
  },
  filterOptionActive: {
    backgroundColor: '#4CAF50',
  },
  filterOptionText: {
    fontSize: 14,
    color: '#666',
  },
  filterOptionTextActive: {
    color: '#fff',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  resetButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    marginRight: 8,
  },
  resetButtonText: {
    fontSize: 16,
    color: '#666',
  },
  applyButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 8,
  },
  applyButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
});

export default TasksScreen;
