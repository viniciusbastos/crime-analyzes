import React, { useState } from "react";
import axios from "axios";
import { useAuth } from "../hooks/useAuth";
import { FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
import ReCAPTCHA from "react-google-recaptcha";
import { useTranslation } from "react-i18next";

const Login = () => {
  const { login } = useAuth();
  const { t } = useTranslation();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [captchaToken, setCaptchaToken] = useState(null);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

    if (e.target.name === "password") {
      setPasswordStrength(calculatePasswordStrength(e.target.value));
    }
  };

  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await axios.post("/auth/forgot-password", { email: formData.email });
      setError("Password reset email sent! Check your inbox.");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!isLogin && formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const endpoint = isLogin ? "/auth/login" : "/auth/register";
      const payload = isLogin
        ? {
            email: formData.email,
            password: formData.password,
            captchaToken,
            rememberMe,
          }
        : {
            email: formData.email,
            password: formData.password,
            name: formData.name,
            captchaToken,
          };

      const response = await axios.post(endpoint, payload);

      if (isLogin) {
        // Login successful
        const { token } = response.data;
        login(token);
      } else {
        // Registration successful
        setIsLogin(true);
        setError("Registration successful! Please login.");
      }
    } catch (err) {
      setError(err.response?.data?.error || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white text-center">
            <h2 className="text-3xl font-bold mb-2">
              {isLogin ? t('welcome_back') : t('join_us')}
            </h2>
            <p className="text-blue-100">
              {isLogin ? t('sign_in_to_account') : t('create_account')}
            </p>
          </div>

          <div className="p-8">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-lg animate-slide-in">
                <div className="flex items-center">
                  <FaLock className="mr-2" />
                  {error}
                </div>
              </div>
            )}

            {isForgotPassword ? (
              <form onSubmit={handleForgotPassword} className="space-y-6">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-700">
                    {t('reset_password')}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {t('reset_password_desc')}
                  </p>
                </div>

                <div className="relative">
                  <label
                    className="block text-gray-700 text-sm font-semibold mb-2"
                    htmlFor="reset-email"
                  >
                    {t('email')}
                  </label>
                  <div className="relative">
                    <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      id="reset-email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-center">
                  <ReCAPTCHA
                    sitekey="6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI" // Test key
                    onChange={(token) => setCaptchaToken(token)}
                    onExpired={() => setCaptchaToken(null)}
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="rememberMe"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="mr-2"
                  />
                  <label htmlFor="rememberMe" className="text-sm text-gray-600">
                    {t('remember_me')}
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading || !captchaToken}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                >
                  {loading ? t('sending') : t('send_reset_link')}
                </button>
              </form>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {!isLogin && (
                  <div className="relative">
                    <label
                      className="block text-gray-700 text-sm font-semibold mb-2"
                      htmlFor="name"
                    >
                      Full Name
                    </label>
                    <div className="relative">
                      <FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        placeholder="Enter your full name"
                        required={!isLogin}
                      />
                    </div>
                  </div>
                )}

                <div className="relative">
                  <label
                    className="block text-gray-700 text-sm font-semibold mb-2"
                    htmlFor="email"
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                </div>

                <div className="relative">
                  <label
                    className="block text-gray-700 text-sm font-semibold mb-2"
                    htmlFor="password"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="Enter your password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  {!isLogin && formData.password && (
                    <div className="mt-2">
                      <div className="flex space-x-1 mb-1">
                        {[1, 2, 3, 4, 5].map((level) => (
                          <div
                            key={level}
                            className={`h-2 flex-1 rounded-full transition-colors duration-200 ${
                              level <= passwordStrength
                                ? passwordStrength <= 2
                                  ? "bg-red-500"
                                  : passwordStrength <= 3
                                  ? "bg-yellow-500"
                                  : "bg-green-500"
                                : "bg-gray-200"
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-gray-600">
                        {passwordStrength === 0 && "Very weak"}
                        {passwordStrength === 1 && "Weak"}
                        {passwordStrength === 2 && "Fair"}
                        {passwordStrength === 3 && "Good"}
                        {passwordStrength === 4 && "Strong"}
                        {passwordStrength === 5 && "Very strong"}
                      </p>
                    </div>
                  )}
                </div>

                {!isLogin && (
                  <div className="relative">
                    <label
                      className="block text-gray-700 text-sm font-semibold mb-2"
                      htmlFor="confirmPassword"
                    >
                      Confirm Password
                    </label>
                    <div className="relative">
                      <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="password"
                        id="confirmPassword"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        placeholder="Confirm your password"
                        required={!isLogin}
                      />
                    </div>
                  </div>
                )}

                <div className="flex justify-center">
                  <ReCAPTCHA
                    sitekey="6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI" // Test key
                    onChange={(token) => setCaptchaToken(token)}
                    onExpired={() => setCaptchaToken(null)}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !captchaToken}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Processing...
                    </div>
                  ) : isLogin ? (
                    "Sign In"
                  ) : (
                    "Create Account"
                  )}
                </button>
              </form>
            )}

            <div className="text-center mt-6 space-y-2">
              {isForgotPassword ? (
                <button
                  onClick={() => {
                    setIsForgotPassword(false);
                    setError("");
                    setCaptchaToken(null);
                  }}
                  className="text-blue-600 hover:text-blue-800 font-medium transition-colors duration-200"
                >
                  ← Back to Login
                </button>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setIsLogin(!isLogin);
                      setError("");
                      setFormData({ email: "", password: "", name: "", confirmPassword: "" });
                      setCaptchaToken(null);
                    }}
                    className="text-blue-600 hover:text-blue-800 font-medium transition-colors duration-200"
                  >
                    {isLogin
                      ? "Don't have an account? Sign up"
                      : "Already have an account? Sign in"}
                  </button>
                  {isLogin && (
                    <div>
                      <button
                        onClick={() => {
                          setIsForgotPassword(true);
                          setError("");
                          setCaptchaToken(null);
                        }}
                        className="text-gray-500 hover:text-gray-700 text-sm transition-colors duration-200"
                      >
                        Forgot your password?
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
