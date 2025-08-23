import React, { useEffect } from 'react';
import {
  View, Text, StyleSheet, Dimensions, Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';

const { width, height } = Dimensions.get('window');

const SplashScreen = () => {
  const logoScale = new Animated.Value(0);
  const logoOpacity = new Animated.Value(0);
  const titleOpacity = new Animated.Value(0);
  const subtitleOpacity = new Animated.Value(0);

  useEffect(() => {
    startAnimation();
  }, []);

  const startAnimation = () => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(logoScale, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(titleOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(subtitleOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#4CAF50', '#45a049', '#2E7D32']}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <Animated.View
            style={[
              styles.logoContainer,
              {
                transform: [{ scale: logoScale }],
                opacity: logoOpacity,
              },
            ]}
          >
            <View style={styles.logo}>
              <Icon name="assignment" size={80} color="#fff" />
            </View>
          </Animated.View>

          <Animated.Text
            style={[
              styles.title,
              { opacity: titleOpacity },
            ]}
          >
            Task Manager
          </Animated.Text>

          <Animated.Text
            style={[
              styles.subtitle,
              { opacity: subtitleOpacity },
            ]}
          >
            Управляйте задачами с удовольствием
          </Animated.Text>

          <View style={styles.features}>
            <View style={styles.feature}>
              <Icon name="emoji-events" size={20} color="#fff" />
              <Text style={styles.featureText}>Геймификация</Text>
            </View>
            <View style={styles.feature}>
              <Icon name="smart-toy" size={20} color="#fff" />
              <Text style={styles.featureText}>AI-ассистент</Text>
            </View>
            <View style={styles.feature}>
              <Icon name="analytics" size={20} color="#fff" />
              <Text style={styles.featureText}>Аналитика</Text>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Версия 1.0.0
          </Text>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  logoContainer: {
    marginBottom: 40,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 18,
    color: '#fff',
    opacity: 0.9,
    textAlign: 'center',
    marginBottom: 60,
    lineHeight: 24,
  },
  features: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    maxWidth: 300,
  },
  feature: {
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    textAlign: 'center',
  },
  footer: {
    paddingBottom: 40,
  },
  footerText: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.7,
  },
});

export default SplashScreen;
