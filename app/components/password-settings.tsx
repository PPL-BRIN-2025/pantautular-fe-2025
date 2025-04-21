"use client"

import { X } from "lucide-react"
import { Button } from "./ui-profile/button"
import { Input } from "./ui-profile/input"

interface PasswordSettingsProps {
  onClose: () => void
}

export default function PasswordSettings({ onClose }: Readonly<PasswordSettingsProps>) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-3xl rounded-lg bg-white p-6 shadow-lg">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Ubah Kata Sandi</h2>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-blue-500">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                <path
                  d="M8 12L11 15L16 9"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <p>Kata sandi harus terdiri dari setidaknya 8 karakter</p>
            </div>

            <div className="flex items-center gap-2 text-blue-500">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                <path
                  d="M8 12L11 15L16 9"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <p>Kata sandi harus terdiri dari setidaknya 1 huruf kapital</p>
            </div>

            <div className="flex items-center gap-2 text-blue-500">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                <path
                  d="M8 12L11 15L16 9"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <p>Kata sandi harus terdiri dari setidaknya 1 huruf kecil</p>
            </div>

            <div className="flex items-center gap-2 text-blue-500">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                <path
                  d="M8 12L11 15L16 9"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <p>Kata sandi harus terdiri dari setidaknya 1 angka</p>
            </div>

            <div className="flex items-center gap-2 text-blue-500">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                <path
                  d="M8 12L11 15L16 9"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
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
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="new-password" className="block text-gray-700">
                Kata Sandi Baru
              </label>
              <Input id="new-password" type="password" placeholder="Masukkan kata sandi baru" className="w-full" />
            </div>

            <div className="space-y-2">
              <label htmlFor="confirm-password" className="block text-gray-700">
                Konfirmasi Kata Sandi
              </label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="Pastikan konfirmasi kata sandi sesuai"
                className="w-full"
              />
            </div>

            <Button className="mt-4 w-full">Ubah Kata Sandi</Button>
          </div>
        </div>
      </div>
    </div>
  )
}