"use client";

import { useState } from 'react';
import { IPasswordValidator } from '../../../utils/PasswordValidator';

interface PasswordFormProps {
  passwordValidator: IPasswordValidator;
}

export default function PasswordForm({ passwordValidator }: PasswordFormProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

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

  const inputClass = "w-full border border-gray-300 rounded-md p-2 " +
    "focus:outline-none focus:ring-4 focus:ring-[#c2dbfe] focus:border-[#86b7fe] " +
    "transition duration-200 ease-in-out";

  return (
    <form className="space-y-6">
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
        disabled={!!passwordError || !!confirmPasswordError || !password || !confirmPassword}
      >
        Simpan Kata Sandi
      </button>
    </form>
  );
}