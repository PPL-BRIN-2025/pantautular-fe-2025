import PasswordValidator from '../../utils/PasswordValidator';

describe('PasswordValidator', () => {
  let validator: PasswordValidator;

  beforeEach(() => {
    validator = new PasswordValidator();
  });

  test('returns empty string for valid password', () => {
    const validPassword = 'Valid1Password!';
    expect(validator.validate(validPassword)).toBe('');
  });

  test('rejects password with less than 8 characters', () => {
    const shortPassword = 'Abc1!';
    expect(validator.validate(shortPassword)).toBe('Password harus minimal 8 karakter');
  });

  test('rejects password without uppercase letters', () => {
    const noUppercasePassword = 'password123!';
    expect(validator.validate(noUppercasePassword)).toBe('Password harus memiliki minimal 1 huruf kapital');
  });

  test('rejects password without lowercase letters', () => {
    const noLowercasePassword = 'PASSWORD123!';
    expect(validator.validate(noLowercasePassword)).toBe('Password harus memiliki minimal 1 huruf kecil');
  });

  test('rejects password without numbers', () => {
    const noNumberPassword = 'Password!';
    expect(validator.validate(noNumberPassword)).toBe('Password harus memiliki minimal 1 angka');
  });

  test('rejects password without special characters', () => {
    const noSpecialCharPassword = 'Password123';
    expect(validator.validate(noSpecialCharPassword)).toBe('Password harus memiliki minimal 1 simbol khusus');
  });

  test('validates password with minimum requirements', () => {
    const barelyValidPassword = 'Passw0rd!';
    expect(validator.validate(barelyValidPassword)).toBe('');
  });

  test('validates password with multiple special characters', () => {
    const complexPassword = 'P@ssw0rd!#$%';
    expect(validator.validate(complexPassword)).toBe('');
  });

  test('checks requirements in correct order', () => {
    // Missing all requirements except length - should fail at uppercase check
    const passwordMissingMultiple = 'password';
    expect(validator.validate(passwordMissingMultiple)).toBe('Password harus memiliki minimal 1 huruf kapital');
  });
});