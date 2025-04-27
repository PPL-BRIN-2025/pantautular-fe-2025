"use client";

import PasswordForm from '../../../../components/forgot_password/ResetPasswordForm';
import PasswordValidator from '../../../../../utils/PasswordValidator';

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="flex flex-col md:flex-row w-full max-w-6xl items-center justify-center p-4">
        {/* Left Image Section */}
        <div className="w-full md:w-1/2 flex justify-center">
          <img
            src="/forgotPassword.svg"
            alt="Forgot Password Illustration"
            className="object-contain max-h-96"
          />
        </div>

        {/* Right Form Section */}
        <div className="w-full md:w-1/2 px-4">
          <h1 className="text-3xl font-bold mb-8 text-[#093062] text-center">
            Lupa Kata Sandi
          </h1>
          
          <PasswordForm passwordValidator={new PasswordValidator()} />
        </div>
      </div>
    </div>
  );
}