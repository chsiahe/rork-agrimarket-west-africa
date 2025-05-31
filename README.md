# AgriConnect

AgriConnect est une plateforme de mise en relation entre agriculteurs et acheteurs en Afrique de l'Ouest.

## Fonctionnalités

- 🌾 Publication d'annonces de produits agricoles
- 💬 Messagerie intégrée entre vendeurs et acheteurs
- 📊 Suivi des tendances du marché en temps réel
- 📍 Géolocalisation des produits
- 🚚 Options de livraison flexibles
- ⭐ Système de notation des utilisateurs
- 📱 Interface adaptative (mobile, tablette, web)

## Technologies

- React Native avec Expo
- TypeScript
- Supabase pour la base de données
- tRPC pour l'API
- Zustand pour la gestion d'état
- Expo Router pour la navigation

## Installation

1. Cloner le projet
```bash
git clone https://github.com/votre-repo/agriconnect.git
cd agriconnect
```

2. Installer les dépendances
```bash
npm install
```

3. Configurer les variables d'environnement
```bash
cp .env.example .env
# Remplir les variables dans .env
```

4. Lancer le projet
```bash
npm start
```

## Structure de la base de données

Le projet utilise Supabase avec les tables suivantes :

- users: Profils utilisateurs
- products: Annonces de produits
- chats: Conversations entre utilisateurs
- messages: Messages des conversations
- market_trends: Tendances des prix du marché
- operating_areas: Zones d'opération des vendeurs
- user_ratings: Système de notation

## Contribution

Les contributions sont les bienvenues ! Voici comment contribuer :

1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add some AmazingFeature'`)
4. Push sur la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## Contact

Pour toute question ou suggestion, n'hésitez pas à ouvrir une issue ou à nous contacter directement.