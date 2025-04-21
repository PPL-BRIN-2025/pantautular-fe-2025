export interface IPasswordValidator {
  validate(password: string): string;
}

export default class PasswordValidator implements IPasswordValidator {
  validate(password: string): string {
    if (password.length < 8) {
      return "Password harus minimal 8 karakter";
    }
    if (!/[A-Z]/.test(password)) {
      return "Password harus memiliki minimal 1 huruf kapital";
    }
    if (!/[a-z]/.test(password)) {
      return "Password harus memiliki minimal 1 huruf kecil";
    }
    if (!/\d/.test(password)) {
      return "Password harus memiliki minimal 1 angka";
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(password)) {
      return "Password harus memiliki minimal 1 simbol khusus";
    }
    return "";
  }
}