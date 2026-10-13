// Every English auth string lives here so feature 4 can swap in EN/FR
// translations without touching the forms.
export const AuthMessages = {
  appName: "Accordly",
  fields: {
    firstName: "First name",
    lastName: "Last name",
    email: "Email address",
    password: "Password",
    newPassword: "New password",
    passwordHint: "At least 8 characters.",
  },
  signIn: {
    title: "Sign in to your account",
    submit: "Sign in",
    submitting: "Signing in…",
    forgotPassword: "Forgot password?",
    noAccount: "New to Accordly?",
    createAccount: "Create an account",
    resend: "Resend confirmation email",
    resending: "Sending…",
  },
  signUp: {
    title: "Create your account",
    submit: "Create account",
    submitting: "Creating account…",
    haveAccount: "Already have an account?",
    signIn: "Sign in",
    checkEmail:
      "Check your email for a link to confirm your account. Then sign in.",
  },
  forgotPassword: {
    title: "Reset your password",
    description: "Enter your email and we'll send you a link to reset your password.",
    submit: "Send reset link",
    submitting: "Sending…",
    sent: "If an account exists for that email, we've sent a link to reset your password.",
    backToSignIn: "Back to sign in",
  },
  resetPassword: {
    title: "Choose a new password",
    submit: "Update password",
    submitting: "Updating…",
  },
  profile: {
    title: "Profile",
    description: "Your name is shown to your co-parent and in exported records.",
    completePrompt:
      "Add your first and last name. Your co-parent will see them on invites, messages, and exported records.",
    emailHint: "The email you sign in with.",
    save: "Save",
    saving: "Saving…",
    saved: "Your profile has been saved.",
    signOut: "Sign out",
    loading: "Loading your profile…",
  },
  notices: {
    passwordUpdated: "Your password has been updated.",
    confirmationSent: "We've sent a new confirmation email. Check your inbox.",
  },
  errors: {
    emailRequired: "Enter your email address.",
    emailInvalid: "Enter a valid email address.",
    passwordRequired: "Enter your password.",
    passwordLength: "Use between 8 and 72 characters.",
    passwordWeak: "Choose a stronger password.",
    passwordSame: "Choose a password different from your current one.",
    firstNameLength: "Enter a first name of up to 100 characters.",
    lastNameLength: "Enter a last name of up to 100 characters.",
    invalidCredentials: "The email or password is incorrect.",
    emailNotConfirmed:
      "Confirm your email before signing in. Check your inbox for the link.",
    rateLimited: "Too many attempts. Wait a few minutes and try again.",
    linkInvalid: "That link is invalid or has expired. Request a new one.",
    sessionExpired: "Your reset link has expired. Request a new one.",
    signedOut: "Your session has ended. Sign in again.",
    unexpected: "Something went wrong. Please try again.",
  },
} as const;
