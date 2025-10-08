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

const ForgotPasswordScreen = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const { forgotPassword } = useAuth();
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { theme } = useTheme();

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert(t('auth.error'), t('auth.emailRequired'));
      return;
    }

    setLoading(true);
    try {
      const result = await forgotPassword(email);
      if (result.success) {
        Alert.alert(t('auth.success'), result.message, [
          { text: 'OK', onPress: () => navigation.navigate('Login') }
        ]);
      } else {
        Alert.alert(t('auth.error'), result.error);
      }
    } catch (error) {
      Alert.alert(t('auth.error'), t('auth.forgotPasswordFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.colors.onSurface }]}>{t('auth.forgotPassword')}</Text>
        <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>{t('auth.forgotPasswordInstructions')}</Text>

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

        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.primary }, loading && styles.buttonDisabled]}
          onPress={handleForgotPassword}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={theme.colors.onPrimary} />
          ) : (
            <Text style={[styles.buttonText, { color: theme.colors.onPrimary }]}>{t('auth.resetPassword')}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={[styles.linkText, { color: theme.colors.primary }]}>{t('auth.backToLogin')}</Text>
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
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
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

export default ForgotPasswordScreen;