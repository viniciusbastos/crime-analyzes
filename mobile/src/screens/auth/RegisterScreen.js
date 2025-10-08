import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

const RegisterScreen = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { theme } = useTheme();

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert(t('auth.error'), t('auth.fillAllFields'));
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(t('auth.error'), t('auth.passwordMismatch'));
      return;
    }

    if (password.length < 6) {
      Alert.alert(t('auth.error'), t('auth.passwordTooShort'));
      return;
    }

    setLoading(true);
    try {
      const result = await register(email, password, name);
      if (result.success) {
        Alert.alert(t('auth.success'), t('auth.registrationSuccess'), [
          { text: 'OK', onPress: () => navigation.navigate('Login') }
        ]);
      } else {
        Alert.alert(t('auth.error'), result.error);
      }
    } catch (error) {
      Alert.alert(t('auth.error'), t('auth.registrationFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView style={styles.content}>
        <Text style={[styles.title, { color: theme.colors.onSurface }]}>{t('auth.register')}</Text>

        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: theme.colors.onSurface }]}>{t('auth.name')}</Text>
          <TextInput
            style={[styles.input, { borderColor: theme.colors.outline, backgroundColor: theme.colors.surface, color: theme.colors.onSurface }]}
            value={name}
            onChangeText={setName}
            placeholder={t('auth.namePlaceholder')}
            autoCapitalize="words"
          />
        </View>

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

        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: theme.colors.onSurface }]}>{t('auth.confirmPassword')}</Text>
          <TextInput
            style={[styles.input, { borderColor: theme.colors.outline, backgroundColor: theme.colors.surface, color: theme.colors.onSurface }]}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder={t('auth.confirmPasswordPlaceholder')}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.primary }, loading && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={theme.colors.onPrimary} />
          ) : (
            <Text style={[styles.buttonText, { color: theme.colors.onPrimary }]}>{t('auth.register')}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={[styles.linkText, { color: theme.colors.primary }]}>{t('auth.haveAccount')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
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

export default RegisterScreen;