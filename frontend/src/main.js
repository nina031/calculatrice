// Importation du CSS
import './style.css'

// Sélectionner les éléments du DOM
const display = document.querySelector('#display div');
const buttons = document.querySelectorAll('.btn');
const acButton = document.querySelector('.btn:nth-child(1)'); // Le premier bouton est AC

// Variable pour stocker l'état de la calculatrice
let currentExpression = '0';

// Fonction pour mettre à jour l'affichage
const updateDisplay = () => {
  display.textContent = currentExpression;
};

// Initialiser l'affichage
updateDisplay();

// Fonctions auxiliaires pour la gestion des pourcentages
function extractLastNumber(expression) {
  // Extraire le dernier nombre de l'expression
  const match = expression.match(/(\d+\.?\d*)$/);
  return match ? parseFloat(match[0]) : null;
}

function replaceLastNumber(expression, newValue) {
  // Remplacer le dernier nombre par la nouvelle valeur
  return expression.replace(/(\d+\.?\d*)$/, newValue);
}

// Fonction pour animer un effet de secouement avec Tailwind
const shakeElement = async (element) => {
  // Sauvegarder la classe de transition actuelle
  const originalTransition = element.style.transition;
  
  // Désactiver temporairement les transitions pour un mouvement immédiat
  element.style.transition = 'none';
  
  // Séquence d'animation de secouement
  for (let i = 0; i < 6; i++) {
    if (i % 2 === 0) {
      element.classList.add('translate-x-2');
      element.classList.remove('-translate-x-2');
    } else {
      element.classList.add('-translate-x-2');
      element.classList.remove('translate-x-2');
    }
    // Attendre un court délai entre chaque mouvement
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  
  // Restaurer la position et les transitions
  element.classList.remove('translate-x-2', '-translate-x-2');
  element.style.transition = originalTransition;
};

// Fonction pour gérer les erreurs de calcul
const handleCalculationError = (errorMessage) => {
  console.error("Erreur de calcul:", errorMessage);
  currentExpression = 'Erreur';
  updateDisplay();
  
  // Changer le bouton en AC
  acButton.textContent = 'AC';
  
  // Ajouter une classe de couleur rouge pour l'erreur
  display.classList.add('text-red-500');
  
  // Animer le secouement avec la fonction Tailwind
  shakeElement(display)
    .then(() => {
      // Retirer la classe de couleur rouge après l'animation
      setTimeout(() => {
        display.classList.remove('text-red-500');
      }, 800);
    });
};

// Fonction pour calculer le résultat via l'API
const calculateResult = () => {
  // Préparer l'expression pour l'envoyer à l'API
  let expressionForAPI = currentExpression
    .replace(/×/g, '*')  // Remplacer × par *
    .replace(/÷/g, '/'); // Remplacer ÷ par /
  
  console.log("Expression envoyée à l'API:", expressionForAPI);
  
  fetch('http://127.0.0.1:5000/calculate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ expression: expressionForAPI })
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    console.log("Réponse de l'API:", data);
    
    if (data.error) {
      handleCalculationError(data.error);
    } else {
      currentExpression = data.result.toString();
      updateDisplay();
      acButton.textContent = 'AC';
    }
  })
  .catch(error => {
    handleCalculationError(error.message);
  });
};

// Ajouter un écouteur d'événements à chaque bouton
buttons.forEach(button => {
  button.addEventListener('click', () => {
    const value = button.textContent;
    handleButtonClick(value);
  });
});

// Fonction pour gérer les clics sur les boutons
const handleButtonClick = value => {
  console.log("Bouton cliqué:", value);
  
  // Si l'utilisateur clique sur "="
  if (value === '=') {
    calculateResult();
  }
  // Si l'utilisateur clique sur "AC" (All Clear), réinitialiser la calculatrice
  else if (value === 'AC') {
    currentExpression = '0';
  }
  else if (value === '⌫') {
    if (currentExpression.length === 1) {
      currentExpression = '0';
    }
    else {
      currentExpression = currentExpression.slice(0, -1);
    }
  }
  else if (value === '+/-') {
    const lastChar = currentExpression.slice(-1);
    // Vérifier si le dernier caractère est un chiffre
    if (/[0-9]/.test(lastChar)) {
      currentExpression = currentExpression.slice(0, -1) + `(-${lastChar})`;
    }
    // Si ce n'est pas un chiffre, ne rien faire
  }
  else if (value === '%') {
    const lastNumber = extractLastNumber(currentExpression);
    if (lastNumber) {
      // Remplacer le dernier nombre par sa valeur en pourcentage
      const percentValue = lastNumber / 100;
      currentExpression = replaceLastNumber(currentExpression, percentValue);
    }
  }
  // Si l'affichage montre juste "0", remplacer par la nouvelle valeur
  else if (currentExpression === '0') {
    currentExpression = value;
    acButton.textContent = '⌫';
  }
  // Sinon, ajouter la valeur à l'expression existante
  else {
    currentExpression += value;
    acButton.textContent = '⌫';
  }
  
  // Mettre à jour l'affichage
  updateDisplay();
};