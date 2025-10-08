import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

const LoginScreen = () => {
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('admin123');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { theme } = useTheme();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert(t('auth.error'), t('auth.fillAllFields'));
      return;
    }

    setLoading(true);
    try {
      const result = await login(email, password, rememberMe);
      if (!result.success) {
        Alert.alert(t('auth.error'), result.error);
      }
      // Navigation will automatically change due to auth state change
    } catch (error) {
      Alert.alert(t('auth.error'), t('auth.loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.colors.onSurface }]}>{t('auth.login')}</Text>

        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: theme.colors.onSurface }]}>{t('auth.email')}</Text>
          <TextInput
            style={[styles.input, { borderColor: theme.colors.outline, backgroundColor: theme.colors.surface, color: theme.colors.onSurface }]}
            value={email}
            onChangeText={setEmail}
            placeholder={t('auth.emailPlaceholder')}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: theme.colors.onSurface }]}>{t('auth.password')}</Text>
          <TextInput
            style={[styles.input, { borderColor: theme.colors.outline, backgroundColor: theme.colors.surface, color: theme.colors.onSurface }]}
            value={password}
            onChangeText={setPassword}
            placeholder={t('auth.passwordPlaceholder')}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View style={styles.checkboxContainer}>
          <TouchableOpacity
            style={styles.checkbox}
            onPress={() => setRememberMe(!rememberMe)}
          >
            <View style={[styles.checkboxBox, { borderColor: theme.colors.primary }, rememberMe && [styles.checkboxChecked, { backgroundColor: theme.colors.primary }]]}>
              {rememberMe && <Text style={[styles.checkmark, { color: theme.colors.onPrimary }]}>✓</Text>}
            </View>
            <Text style={[styles.checkboxLabel, { color: theme.colors.onSurface }]}>{t('auth.rememberMe')}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.primary }, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={theme.colors.onPrimary} />
          ) : (
            <Text style={[styles.buttonText, { color: theme.colors.onPrimary }]}>{t('auth.login')}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => navigation.navigate('Register')}
        >
          <Text style={[styles.linkText, { color: theme.colors.primary }]}>{t('auth.noAccount')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => navigation.navigate('ForgotPassword')}
        >
          <Text style={[styles.linkText, { color: theme.colors.primary }]}>{t('auth.forgotPassword')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  checkboxContainer: {
    marginBottom: 20,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderRadius: 4,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {},
  checkmark: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 16,
  },
  button: {
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  linkButton: {
    alignItems: 'center',
    marginBottom: 10,
  },
  linkText: {
    fontSize: 16,
  },
});

export default LoginScreen;