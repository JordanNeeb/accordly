import type { Messages } from './en';

// Canadian French UI strings. Typed as `Messages`, so a missing or extra key
// fails typecheck.
export const fr: Messages = {
  languageMenu: {
    label: 'Langue',
  },
  auth: {
    fields: {
      name: 'Nom',
      email: 'Adresse courriel',
      password: 'Mot de passe',
      newPassword: 'Nouveau mot de passe',
      passwordHint: 'Au moins 8 caractères.',
    },
    signIn: {
      title: 'Connectez-vous à votre compte',
      submit: 'Se connecter',
      submitting: 'Connexion…',
      forgotPassword: 'Mot de passe oublié?',
      noAccount: 'Nouveau sur Tango?',
      createAccount: 'Créer un compte',
      resend: 'Renvoyer le courriel de confirmation',
      resending: 'Envoi…',
    },
    signUp: {
      title: 'Créez votre compte',
      submit: 'Créer le compte',
      submitting: 'Création du compte…',
      haveAccount: 'Vous avez déjà un compte?',
      signIn: 'Se connecter',
      checkEmail:
        'Consultez vos courriels pour trouver le lien de confirmation de votre compte. Connectez-vous ensuite.',
    },
    google: {
      divider: 'Ou continuer avec',
      continue: 'Continuer avec Google',
      redirecting: 'Redirection vers Google…',
    },
    forgotPassword: {
      title: 'Réinitialiser votre mot de passe',
      description:
        'Entrez votre adresse courriel et nous vous enverrons un lien pour réinitialiser votre mot de passe.',
      submit: 'Envoyer le lien',
      submitting: 'Envoi…',
      sent: 'Si un compte existe pour cette adresse, nous avons envoyé un lien pour réinitialiser votre mot de passe.',
      backToSignIn: 'Retour à la connexion',
    },
    resetPassword: {
      title: 'Choisissez un nouveau mot de passe',
      submit: 'Mettre à jour le mot de passe',
      submitting: 'Mise à jour…',
    },
    profile: {
      title: 'Profil',
      description:
        "Votre nom est visible par l'autre parent et dans les dossiers exportés.",
      completePrompt:
        "Ajoutez votre nom. L'autre parent le verra dans les invitations, les messages et les dossiers exportés.",
      emailHint: "L'adresse courriel que vous utilisez pour vous connecter.",
      save: 'Enregistrer',
      saving: 'Enregistrement…',
      saved: 'Votre profil a été enregistré.',
      signOut: 'Se déconnecter',
      loading: 'Chargement de votre profil…',
    },
    notices: {
      passwordUpdated: 'Votre mot de passe a été mis à jour.',
      confirmationSent:
        'Nous avons envoyé un nouveau courriel de confirmation. Vérifiez votre boîte de réception.',
    },
    errors: {
      emailRequired: 'Entrez votre adresse courriel.',
      emailInvalid: 'Entrez une adresse courriel valide.',
      passwordRequired: 'Entrez votre mot de passe.',
      passwordLength: 'Utilisez entre 8 et 72 caractères.',
      passwordWeak: 'Choisissez un mot de passe plus robuste.',
      passwordSame: 'Choisissez un mot de passe différent de votre mot de passe actuel.',
      nameLength: "Entrez un nom d'au plus 100 caractères.",
      invalidCredentials: "L'adresse courriel ou le mot de passe est incorrect.",
      emailNotConfirmed:
        'Confirmez votre adresse courriel avant de vous connecter. Le lien se trouve dans votre boîte de réception.',
      rateLimited: 'Trop de tentatives. Attendez quelques minutes et réessayez.',
      linkInvalid: 'Ce lien est invalide ou a expiré. Demandez-en un nouveau.',
      sessionExpired: 'Votre lien de réinitialisation a expiré. Demandez-en un nouveau.',
      signedOut: 'Votre session a pris fin. Connectez-vous de nouveau.',
      googleFailed: "La connexion avec Google n'a pas abouti. Réessayez.",
      unexpected: "Une erreur s'est produite. Veuillez réessayer.",
    },
  },
  dashboard: {
    title: 'Tableau de bord',
    navigation: {
      dashboard: 'Tableau de bord',
      team: 'Équipe',
      projects: 'Projets',
      calendar: 'Calendrier',
      documents: 'Documents',
      reports: 'Rapports',
    },
    teamsHeading: 'Vos équipes',
    teams: {
      heroicons: 'Heroicons',
      tailwindLabs: 'Tailwind Labs',
      workcation: 'Workcation',
    },
    settings: 'Paramètres',
    search: 'Rechercher',
    openSidebar: 'Ouvrir le menu latéral',
    closeSidebar: 'Fermer le menu latéral',
    viewNotifications: 'Voir les notifications',
    openUserMenu: 'Ouvrir le menu utilisateur',
    yourProfile: 'Votre profil',
    signOut: 'Se déconnecter',
  },
  landing: {
    nav: {
      label: 'Principal',
      logIn: 'Se connecter',
    },
    headline: 'La coparentalité, sans le conflit.',
    description:
      'Conçu au Canada pour les familles canadiennes. Des messages permanents prêts pour le tribunal, un horaire que les deux parents respectent, et des dépenses et pensions payées depuis votre banque canadienne.',
    getStarted: 'Commencer',
    learnMore: 'En savoir plus',
    screenshotAlt: "Capture d'écran de l'application",
  },
};
