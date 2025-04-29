"use client"

import { X } from "lucide-react"
import { Button } from "./ui-profile/button"
import { Input } from "./ui-profile/input"
import { useState } from "react"
import { CheckIcon } from "./ui-profile/Checkicon"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
const API_KEY = process.env.NEXT_PUBLIC_API_KEY;

interface PasswordSettingsProps {
  onClose: () => void
}

export default function PasswordSettings({ onClose }: Readonly<PasswordSettingsProps>) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Password validation
  const hasEightChars = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasNumber = /\d/.test(newPassword);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);
  const passwordsMatch = newPassword === confirmPassword;

  // Check if all validations pass
  const isPasswordValid = 
    hasEightChars && 
    hasUppercase && 
    hasLowercase && 
    hasNumber && 
    hasSpecialChar && 
    passwordsMatch;

  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset messages
    setErrorMessage(null);
    setSuccessMessage(null);
    
    // Check if passwords match
    if (newPassword !== confirmPassword) {
      setErrorMessage("Konfirmasi kata sandi tidak sesuai dengan kata sandi baru");
      return;
    }
    
    // Check if password is valid
    if (!isPasswordValid) {
      setErrorMessage("Kata sandi baru tidak memenuhi semua persyaratan");
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': String(API_KEY)
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
          confirm_password: confirmPassword
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error ?? "Gagal mengubah kata sandi");
      }
      
      setSuccessMessage(data.message ?? "Kata sandi berhasil diubah");
      
      // Clear form fields on success
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      
      // Optional: close the modal after a delay
      setTimeout(() => {
        onClose();
      }, 2000);
      
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Terjadi kesalahan tak terduga");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-3xl rounded-lg bg-white p-6 shadow-lg">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Ubah Kata Sandi</h2>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="mb-4 rounded bg-red-100 p-3 text-red-700">
            {errorMessage}
          </div>
        )}
        
        {successMessage && (
          <div className="mb-4 rounded bg-green-100 p-3 text-green-700">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-blue-500">
                <CheckIcon isChecked={hasEightChars} />
                <p>Kata sandi harus terdiri dari setidaknya 8 karakter</p>
              </div>

              <div className="flex items-center gap-2 text-blue-500">
                <CheckIcon isChecked={hasUppercase} />
                <p>Kata sandi harus terdiri dari setidaknya 1 huruf kapital</p>
              </div>

              <div className="flex items-center gap-2 text-blue-500">
                <CheckIcon isChecked={hasLowercase} />
                <p>Kata sandi harus terdiri dari setidaknya 1 huruf kecil</p>
              </div>

              <div className="flex items-center gap-2 text-blue-500">
                <CheckIcon isChecked={hasNumber} />
                <p>Kata sandi harus terdiri dari setidaknya 1 angka</p>
              </div>

              <div className="flex items-center gap-2 text-blue-500">
                <CheckIcon isChecked={hasSpecialChar} />
                <p>Kata sandi harus terdiri dari setidaknya 1 simbol khusus</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="current-password" className="block text-gray-700">
                  Kata Sandi Saat Ini
                </label>
                <Input
                  id="current-password"
                  type="password"
                  placeholder="Masukkan kata sandi saat ini"
                  className="w-full"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="new-password" className="block text-gray-700">
                  Kata Sandi Baru
                </label>
                <Input 
                  id="new-password" 
                  type="password" 
                  placeholder="Masukkan kata sandi baru" 
                  className="w-full"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="confirm-password" className="block text-gray-700">
                  Konfirmasi Kata Sandi
                </label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Pastikan konfirmasi kata sandi sesuai"
                  className={`w-full ${confirmPassword && !passwordsMatch ? "border-red-500" : ""}`}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                {confirmPassword && !passwordsMatch && (
                  <p className="mt-1 text-sm text-red-500">
                    Konfirmasi kata sandi tidak sesuai
                  </p>
                )}
              </div>

              <Button 
                className="mt-4 w-full" 
                type="submit"
                disabled={!currentPassword || !isPasswordValid || isLoading}
              >
                {isLoading ? "Sedang Memproses..." : "Ubah Kata Sandi"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}