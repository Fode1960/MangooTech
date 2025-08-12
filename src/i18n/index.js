import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

// Traductions françaises
const fr = {
  translation: {
    // Navigation
    nav: {
      home: 'Accueil',
      services: 'Services',
      about: 'À propos',
      contact: 'Contact',
      login: 'Connexion',
      register: 'Inscription',
      dashboard: 'Tableau de bord'
    },
    // Page d'accueil
    home: {
      hero: {
        title: 'Solutions Numériques Innovantes pour l\'Afrique',
        subtitle: 'Découvrez nos solutions technologiques modulaires qui démocratisent la digitalisation pour tous les acteurs économiques.',
        cta: 'Découvrir nos services',
        ctaSecondary: 'Nous contacter'
      },
      features: {
        title: 'Pourquoi choisir Mangoo Tech ?',
        accessibility: {
          title: 'Accessibilité',
          description: 'Solutions adaptées à tous les budgets et niveaux techniques'
        },
        modularity: {
          title: 'Modularité',
          description: 'Choisissez uniquement les services dont vous avez besoin'
        },
        innovation: {
          title: 'Innovation',
          description: 'Technologies de pointe adaptées au marché africain'
        },
        security: {
          title: 'Sécurité',
          description: 'Protection maximale de vos données et transactions'
        }
      },
      services: {
        title: 'Nos Services Principaux',
        miniSites: {
          title: 'Mini-sites',
          description: 'Créez votre présence en ligne rapidement'
        },
        ecommerce: {
          title: 'Mini-boutiques',
          description: 'Vendez vos produits en ligne facilement'
        },
        payment: {
          title: 'Mangoo Pay+',
          description: 'Solutions de paiement sécurisées'
        },
        delivery: {
          title: 'Mangoo Express+',
          description: 'Livraison rapide et fiable'
        }
      }
    },
    // Services
    services: {
      title: 'Nos Services',
      subtitle: 'Solutions complètes pour votre transformation digitale',
      categories: {
        websites: 'Sites Web',
        ecommerce: 'E-commerce',
        communication: 'Communication',
        business: 'Business',
        specialized: 'Spécialisés'
      }
    },
    // Contact
    contact: {
      title: 'Contactez-nous',
      subtitle: 'Nous sommes là pour vous accompagner',
      form: {
        name: 'Nom complet',
        email: 'Adresse e-mail',
        phone: 'Téléphone',
        subject: 'Sujet',
        message: 'Message',
        send: 'Envoyer le message',
        sending: 'Envoi en cours...',
        success: 'Message envoyé avec succès !',
        error: 'Erreur lors de l\'envoi du message'
      }
    },
    // Authentification
    auth: {
      login: {
        title: 'Connexion',
        subtitle: 'Accédez à votre espace personnel',
        email: 'Votre adresse e-mail',
        password: 'Votre mot de passe',
        submit: 'Se connecter',
        forgotPassword: 'Mot de passe oublié ?',
        noAccount: 'Pas encore de compte ?',
        signUp: 'Créer un compte'
      },
      register: {
        title: 'Inscription',
        subtitle: 'Créez votre compte Mangoo Tech',
        firstName: 'Prénom',
        lastName: 'Nom',
        email: 'Votre adresse e-mail',
        password: 'Votre mot de passe',
        confirmPassword: 'Confirmer le mot de passe',
        accountType: 'Type de compte',
        individual: 'Particulier',
        professional: 'Professionnel',
        submit: 'Créer le compte',
        hasAccount: 'Déjà un compte ?',
        signIn: 'Se connecter'
      }
    },
    // Commun
    common: {
      loading: 'Chargement...',
      error: 'Une erreur est survenue',
      success: 'Opération réussie',
      cancel: 'Annuler',
      save: 'Enregistrer',
      edit: 'Modifier',
      delete: 'Supprimer',
      confirm: 'Confirmer',
      back: 'Retour',
      next: 'Suivant',
      previous: 'Précédent',
      close: 'Fermer'
    }
  }
}

// Traductions anglaises
const en = {
  translation: {
    // Navigation
    nav: {
      home: 'Home',
      services: 'Services',
      about: 'About',
      contact: 'Contact',
      login: 'Login',
      register: 'Register',
      dashboard: 'Dashboard'
    },
    // Page d'accueil
    home: {
      hero: {
        title: 'Innovative Digital Solutions for Africa',
        subtitle: 'Discover our modular technological solutions that democratize digitalization for all economic actors.',
        cta: 'Discover our services',
        ctaSecondary: 'Contact us'
      },
      features: {
        title: 'Why choose Mangoo Tech?',
        accessibility: {
          title: 'Accessibility',
          description: 'Solutions adapted to all budgets and technical levels'
        },
        modularity: {
          title: 'Modularity',
          description: 'Choose only the services you need'
        },
        innovation: {
          title: 'Innovation',
          description: 'Cutting-edge technologies adapted to the African market'
        },
        security: {
          title: 'Security',
          description: 'Maximum protection of your data and transactions'
        }
      },
      services: {
        title: 'Our Main Services',
        miniSites: {
          title: 'Mini-sites',
          description: 'Create your online presence quickly'
        },
        ecommerce: {
          title: 'Mini-shops',
          description: 'Sell your products online easily'
        },
        payment: {
          title: 'Mangoo Pay+',
          description: 'Secure payment solutions'
        },
        delivery: {
          title: 'Mangoo Express+',
          description: 'Fast and reliable delivery'
        }
      }
    },
    // Services
    services: {
      title: 'Our Services',
      subtitle: 'Complete solutions for your digital transformation',
      categories: {
        websites: 'Websites',
        ecommerce: 'E-commerce',
        communication: 'Communication',
        business: 'Business',
        specialized: 'Specialized'
      }
    },
    // Contact
    contact: {
      title: 'Contact Us',
      subtitle: 'We are here to support you',
      form: {
        name: 'Full name',
        email: 'Email address',
        phone: 'Phone',
        subject: 'Subject',
        message: 'Message',
        send: 'Send message',
        sending: 'Sending...',
        success: 'Message sent successfully!',
        error: 'Error sending message'
      }
    },
    // Authentification
    auth: {
      login: {
        title: 'Login',
        subtitle: 'Access your personal space',
        email: 'Your email address',
        password: 'Your password',
        submit: 'Sign in',
        forgotPassword: 'Forgot password?',
        noAccount: 'No account yet?',
        signUp: 'Create account'
      },
      register: {
        title: 'Register',
        subtitle: 'Create your Mangoo Tech account',
        firstName: 'First name',
        lastName: 'Last name',
        email: 'Your email address',
        password: 'Your password',
        confirmPassword: 'Confirm password',
        accountType: 'Account type',
        individual: 'Individual',
        professional: 'Professional',
        submit: 'Create account',
        hasAccount: 'Already have an account?',
        signIn: 'Sign in'
      }
    },
    // Commun
    common: {
      loading: 'Loading...',
      error: 'An error occurred',
      success: 'Operation successful',
      cancel: 'Cancel',
      save: 'Save',
      edit: 'Edit',
      delete: 'Delete',
      confirm: 'Confirm',
      back: 'Back',
      next: 'Next',
      previous: 'Previous',
      close: 'Close'
    }
  }
}

// Traductions espagnoles
const es = {
  translation: {
    // Navigation
    nav: {
      home: 'Inicio',
      services: 'Servicios',
      about: 'Acerca de',
      contact: 'Contacto',
      login: 'Iniciar sesión',
      register: 'Registrarse',
      dashboard: 'Panel de control'
    },
    // Page d'accueil
    home: {
      hero: {
        title: 'Soluciones Digitales Innovadoras para África',
        subtitle: 'Descubre nuestras soluciones tecnológicas modulares que democratizan la digitalización para todos los actores económicos.',
        cta: 'Descubrir nuestros servicios',
        ctaSecondary: 'Contáctanos'
      },
      features: {
        title: '¿Por qué elegir Mangoo Tech?',
        accessibility: {
          title: 'Accesibilidad',
          description: 'Soluciones adaptadas a todos los presupuestos y niveles técnicos'
        },
        modularity: {
          title: 'Modularidad',
          description: 'Elige solo los servicios que necesitas'
        },
        innovation: {
          title: 'Innovación',
          description: 'Tecnologías de vanguardia adaptadas al mercado africano'
        },
        security: {
          title: 'Seguridad',
          description: 'Máxima protección de tus datos y transacciones'
        }
      },
      services: {
        title: 'Nuestros Servicios Principales',
        miniSites: {
          title: 'Mini-sitios',
          description: 'Crea tu presencia en línea rápidamente'
        },
        ecommerce: {
          title: 'Mini-tiendas',
          description: 'Vende tus productos en línea fácilmente'
        },
        payment: {
          title: 'Mangoo Pay+',
          description: 'Soluciones de pago seguras'
        },
        delivery: {
          title: 'Mangoo Express+',
          description: 'Entrega rápida y confiable'
        }
      }
    },
    // Services
    services: {
      title: 'Nuestros Servicios',
      subtitle: 'Soluciones completas para tu transformación digital',
      categories: {
        websites: 'Sitios Web',
        ecommerce: 'E-commerce',
        communication: 'Comunicación',
        business: 'Negocios',
        specialized: 'Especializados'
      }
    },
    // Contact
    contact: {
      title: 'Contáctanos',
      subtitle: 'Estamos aquí para apoyarte',
      form: {
        name: 'Nombre completo',
        email: 'Dirección de correo electrónico',
        phone: 'Teléfono',
        subject: 'Asunto',
        message: 'Mensaje',
        send: 'Enviar mensaje',
        sending: 'Enviando...',
        success: '¡Mensaje enviado con éxito!',
        error: 'Error al enviar el mensaje'
      }
    },
    // Authentification
    auth: {
      login: {
        title: 'Iniciar sesión',
        subtitle: 'Accede a tu espacio personal',
        email: 'Tu dirección de correo electrónico',
        password: 'Tu contraseña',
        submit: 'Iniciar sesión',
        forgotPassword: '¿Olvidaste tu contraseña?',
        noAccount: '¿Aún no tienes cuenta?',
        signUp: 'Crear cuenta'
      },
      register: {
        title: 'Registrarse',
        subtitle: 'Crea tu cuenta Mangoo Tech',
        firstName: 'Nombre',
        lastName: 'Apellido',
        email: 'Tu dirección de correo electrónico',
        password: 'Tu contraseña',
        confirmPassword: 'Confirmar contraseña',
        accountType: 'Tipo de cuenta',
        individual: 'Individual',
        professional: 'Profesional',
        submit: 'Crear cuenta',
        hasAccount: '¿Ya tienes una cuenta?',
        signIn: 'Iniciar sesión'
      }
    },
    // Commun
    common: {
      loading: 'Cargando...',
      error: 'Ocurrió un error',
      success: 'Operación exitosa',
      cancel: 'Cancelar',
      save: 'Guardar',
      edit: 'Editar',
      delete: 'Eliminar',
      confirm: 'Confirmar',
      back: 'Atrás',
      next: 'Siguiente',
      previous: 'Anterior',
      close: 'Cerrar'
    }
  }
}

// Traductions portugaises
const pt = {
  translation: {
    // Navigation
    nav: {
      home: 'Início',
      services: 'Serviços',
      about: 'Sobre',
      contact: 'Contato',
      login: 'Entrar',
      register: 'Registrar',
      dashboard: 'Painel'
    },
    // Page d'accueil
    home: {
      hero: {
        title: 'Soluções Digitais Inovadoras para a África',
        subtitle: 'Descubra nossas soluções tecnológicas modulares que democratizam a digitalização para todos os atores econômicos.',
        cta: 'Descobrir nossos serviços',
        ctaSecondary: 'Entre em contato'
      },
      features: {
        title: 'Por que escolher a Mangoo Tech?',
        accessibility: {
          title: 'Acessibilidade',
          description: 'Soluções adaptadas a todos os orçamentos e níveis técnicos'
        },
        modularity: {
          title: 'Modularidade',
          description: 'Escolha apenas os serviços que você precisa'
        },
        innovation: {
          title: 'Inovação',
          description: 'Tecnologias de ponta adaptadas ao mercado africano'
        },
        security: {
          title: 'Segurança',
          description: 'Máxima proteção dos seus dados e transações'
        }
      },
      services: {
        title: 'Nossos Principais Serviços',
        miniSites: {
          title: 'Mini-sites',
          description: 'Crie sua presença online rapidamente'
        },
        ecommerce: {
          title: 'Mini-lojas',
          description: 'Venda seus produtos online facilmente'
        },
        payment: {
          title: 'Mangoo Pay+',
          description: 'Soluções de pagamento seguras'
        },
        delivery: {
          title: 'Mangoo Express+',
          description: 'Entrega rápida e confiável'
        }
      }
    },
    // Services
    services: {
      title: 'Nossos Serviços',
      subtitle: 'Soluções completas para sua transformação digital',
      categories: {
        websites: 'Sites',
        ecommerce: 'E-commerce',
        communication: 'Comunicação',
        business: 'Negócios',
        specialized: 'Especializados'
      }
    },
    // Contact
    contact: {
      title: 'Entre em Contato',
      subtitle: 'Estamos aqui para apoiá-lo',
      form: {
        name: 'Nome completo',
        email: 'Endereço de e-mail',
        phone: 'Telefone',
        subject: 'Assunto',
        message: 'Mensagem',
        send: 'Enviar mensagem',
        sending: 'Enviando...',
        success: 'Mensagem enviada com sucesso!',
        error: 'Erro ao enviar mensagem'
      }
    },
    // Authentification
    auth: {
      login: {
        title: 'Entrar',
        subtitle: 'Acesse seu espaço pessoal',
        email: 'Seu endereço de e-mail',
        password: 'Sua senha',
        submit: 'Entrar',
        forgotPassword: 'Esqueceu a senha?',
        noAccount: 'Ainda não tem conta?',
        signUp: 'Criar conta'
      },
      register: {
        title: 'Registrar',
        subtitle: 'Crie sua conta Mangoo Tech',
        firstName: 'Nome',
        lastName: 'Sobrenome',
        email: 'Seu endereço de e-mail',
        password: 'Sua senha',
        confirmPassword: 'Confirmar senha',
        accountType: 'Tipo de conta',
        individual: 'Individual',
        professional: 'Profissional',
        submit: 'Criar conta',
        hasAccount: 'Já tem uma conta?',
        signIn: 'Entrar'
      }
    },
    // Commun
    common: {
      loading: 'Carregando...',
      error: 'Ocorreu um erro',
      success: 'Operação bem-sucedida',
      cancel: 'Cancelar',
      save: 'Salvar',
      edit: 'Editar',
      delete: 'Excluir',
      confirm: 'Confirmar',
      back: 'Voltar',
      next: 'Próximo',
      previous: 'Anterior',
      close: 'Fechar'
    }
  }
}

i18n
  .use(initReactI18next)
  .init({
    resources: {
      fr,
      en,
      es,
      pt
    },
    lng: 'fr', // langue par défaut
    fallbackLng: 'fr',
    interpolation: {
      escapeValue: false
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage']
    }
  })

export default i18n