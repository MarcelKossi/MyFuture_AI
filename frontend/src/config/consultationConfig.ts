
// Configuration du cabinet de consultation
// TODO: L'administrateur peut modifier ces informations selon ses besoins

export const consultationConfig = {
  // Informations du cabinet/expert
  name: "Cabinet d'Orientation MyFuture",
  phone: "+33 1 23 45 67 89",
  email: "contact@myfuture-conseil.fr",
  website: "https://www.myfuture-conseil.fr",
  whatsapp: "+33123456789", // Numéro WhatsApp (optionnel)
  
  // Message personnalisé
  description: "Obtenez un accompagnement personnalisé de nos experts en orientation",
  
  // Activation/désactivation du service
  enabled: true,
  
  // Méthodes de contact préférées
  preferredMethods: {
    phone: true,
    email: true,
    website: true,
    whatsapp: true
  }
};
