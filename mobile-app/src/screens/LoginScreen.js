import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useAuth } from '../contexts/AuthContext';

const { width, height } = Dimensions.get('window');

const LoginScreen = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Ошибка', 'Пожалуйста, заполните все поля');
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await login(username.trim(), password);
      
      if (!result.success) {
        Alert.alert('Ошибка входа', result.error || 'Неверные учетные данные');
      }
    } catch (error) {
      Alert.alert('Ошибка', 'Произошла ошибка при входе');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setUsername('admin');
    setPassword('secret');
    
    setTimeout(() => {
      handleLogin();
    }, 500);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <LinearGradient
          colors={['#4CAF50', '#45a049', '#2E7D32']}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <View style={styles.logoContainer}>
              <Icon name="assignment" size={80} color="#fff" />
            </View>
            <Text style={styles.appTitle}>Task Manager</Text>
            <Text style={styles.appSubtitle}>
              Управляйте задачами с удовольствием
            </Text>
          </View>
        </LinearGradient>

        <View style={styles.formContainer}>
          <Text style={styles.welcomeText}>Добро пожаловать!</Text>
          <Text style={styles.descriptionText}>
            Войдите в свой аккаунт для доступа к задачам, достижениям и AI-помощнику
          </Text>

          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <Icon name="person" size={24} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="Имя пользователя"
                placeholderTextColor="#999"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <Icon name="lock" size={24} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="Пароль"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.passwordToggle}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Icon
                  name={showPassword ? 'visibility-off' : 'visibility'}
                  size={24}
                  color="#666"
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            <LinearGradient
              colors={['#4CAF50', '#45a049']}
              style={styles.loginButtonGradient}
            >
              {isLoading ? (
                <Text style={styles.loginButtonText}>Вход...</Text>
              ) : (
                <Text style={styles.loginButtonText}>Войти</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.demoButton}
            onPress={handleDemoLogin}
            disabled={isLoading}
          >
            <Text style={styles.demoButtonText}>Демо вход (admin/secret)</Text>
          </TouchableOpacity>

          <View style={styles.featuresContainer}>
            <Text style={styles.featuresTitle}>Возможности приложения:</Text>
            
            <View style={styles.featureItem}>
              <Icon name="assignment" size={20} color="#4CAF50" />
              <Text style={styles.featureText}>Управление задачами</Text>
            </View>
            
            <View style={styles.featureItem}>
              <Icon name="emoji-events" size={20} color="#FF9800" />
              <Text style={styles.featureText}>Система достижений</Text>
            </View>
            
            <View style={styles.featureItem}>
              <Icon name="smart-toy" size={20} color="#9C27B0" />
              <Text style={styles.featureText}>AI-ассистент</Text>
            </View>
            
            <View style={styles.featureItem}>
              <Icon name="analytics" size={20} color="#2196F3" />
              <Text style={styles.featureText}>Аналитика и статистика</Text>
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Task Manager - Ваш персональный помощник в продуктивности
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 60,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerContent: {
    alignItems: 'center',
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  appSubtitle: {
    fontSize: 16,
    color: '#e8f5e8',
    textAlign: 'center',
    lineHeight: 22,
  },
  formContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -30,
    paddingTop: 40,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  descriptionText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 15,
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  inputIcon: {
    marginRight: 15,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 15,
  },
  passwordToggle: {
    padding: 5,
  },
  loginButton: {
    marginTop: 10,
    marginBottom: 20,
    borderRadius: 25,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  demoButton: {
    alignItems: 'center',
    paddingVertical: 15,
    marginBottom: 30,
  },
  demoButtonText: {
    color: '#4CAF50',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
  featuresContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    padding: 20,
    marginBottom: 30,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 12,
    flex: 1,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default LoginScreen;
