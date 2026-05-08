const RESET_EMAIL_KEY = 'markethub_reset_email';
const RESET_TOKEN_KEY = 'markethub_reset_token';

export const saveResetEmail = (email) => {
  sessionStorage.setItem(RESET_EMAIL_KEY, email);
};

export const getResetEmail = () => sessionStorage.getItem(RESET_EMAIL_KEY) || '';

export const saveResetToken = (token) => {
  sessionStorage.setItem(RESET_TOKEN_KEY, token);
};

export const getResetToken = () => sessionStorage.getItem(RESET_TOKEN_KEY) || '';

export const clearResetSession = () => {
  sessionStorage.removeItem(RESET_EMAIL_KEY);
  sessionStorage.removeItem(RESET_TOKEN_KEY);
};
