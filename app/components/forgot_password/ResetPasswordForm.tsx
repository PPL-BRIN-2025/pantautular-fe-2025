"use client";

import { useState, useEffect } from 'react';
import { IPasswordValidator } from '../../../utils/PasswordValidator';
import { useRouter } from 'next/navigation';

interface PasswordFormProps {
  passwordValidator: IPasswordValidator;
  onSubmit: (password: string, confirmPassword: string) => Promise<void>;
}

export default function PasswordForm({ 
  passwordValidator, 
  onSubmit
}: Readonly<PasswordFormProps>) {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    if (submitSuccess) {
      router.push('/login');
    }
  }, [submitSuccess, router]);

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    setPasswordError(passwordValidator.validate(newPassword));
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newConfirmPassword = e.target.value;
    setConfirmPassword(newConfirmPassword);
    if (newConfirmPassword !== password) {
      setConfirmPasswordError("Konfirmasi password tidak sesuai");
    } else {
      setConfirmPasswordError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (passwordError || confirmPasswordError || !password || !confirmPassword) {
      return;
    }
    
    setIsSubmitting(true);
    setSubmitError('');
    
    try {
      await onSubmit(password, confirmPassword);
      setSubmitSuccess(true);
      setPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Error submitting password reset:', error);
      
      setSubmitError(error instanceof Error ? error.message : 'Terjadi kesalahan saat mengatur ulang kata sandi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = "w-full border border-gray-300 rounded-md p-2 " +
    "focus:outline-none focus:ring-4 focus:ring-[#c2dbfe] focus:border-[#86b7fe] " +
    "transition duration-200 ease-in-out";

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      {submitError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-600">
          {submitError}
        </div>
      )}
      
      <div>
        <label htmlFor="password" className="block font-medium text-black mb-1">
          Kata Sandi
        </label>
        <input
          type="password"
          id="password"
          placeholder="Masukkan kata sandi"
          className={inputClass}
          value={password}
          onChange={handlePasswordChange}
        />
        {passwordError && (
          <p className="text-red-600 text-sm mt-1">{passwordError}</p>
        )}
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block font-medium text-black mb-1">
          Konfirmasi Kata Sandi
        </label>
        <input
          type="password"
          id="confirmPassword"
          placeholder="Pastikan konfirmasi kata sandi sesuai"
          className={inputClass}
          value={confirmPassword}
          onChange={handleConfirmPasswordChange}
        />
        {confirmPasswordError && (
          <p className="text-red-600 text-sm mt-1">{confirmPasswordError}</p>
        )}
      </div>

      <button
        type="submit"
        className="w-full bg-[#0069cf] text-white py-2 px-4 rounded-md hover:bg-blue-700 transition duration-200"
        disabled={!!passwordError || !!confirmPasswordError || !password || !confirmPassword || isSubmitting}
      >
        {isSubmitting ? 'Menyimpan...' : 'Simpan Kata Sandi'}
      </button>
    </form>
  );
}