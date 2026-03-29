let signupToken: string | null = null;

export const getSignupToken = () => signupToken;

export const setSignupToken = (token: string | null) => {
  signupToken = token;
};

export const clearSignupToken = () => {
  signupToken = null;
};

export const hasSignupToken = () => signupToken !== null;
