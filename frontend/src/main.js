// Importation du CSS
import './style.css'

// Sélectionner les éléments du DOM
const display = document.querySelector('#display div');
const buttons = document.querySelectorAll('.btn');
const acButton = document.querySelector('.btn:nth-child(1)'); // Le premier bouton est AC

// Variable pour stocker l'état de la calculatrice
let currentExpression = '0';

// Fonction pour tronquer les grands nombres tout en préservant la notation scientifique
const truncateNumber = (numberString) => {
  // Si c'est déjà en notation scientifique, on la préserve
  if (numberString.includes('e')) {
    const [mantisse, exposant] = numberString.split('e');
    // On arrondit la mantisse à 4 chiffres significatifs maximum
    const truncatedMantisse = parseFloat(mantisse).toFixed(4);
    return `${truncatedMantisse}e${exposant}`;
  }
  
  // Pour les nombres décimaux longs
  if (numberString.includes('.')) {
    const [entier, decimal] = numberString.split('.');
    
    // Si la partie entière est déjà longue
    if (entier.length > 10) {
      return parseFloat(numberString).toExponential(4);
    }
    
    // Sinon, on tronque la partie décimale
    const maxDecimalLength = Math.max(0, 10 - entier.length);
    return `${entier}.${decimal.substring(0, maxDecimalLength)}`;
  }
  
  // Pour les entiers très longs
  if (numberString.length > 10) {
    return parseFloat(numberString).toExponential(4);
  }
  
  return numberString;
};

// Fonction pour ajuster la taille du texte selon sa longueur
const adjustFontSize = () => {
  const displayText = display.textContent;
  const length = displayText.length;
  
  // Retirer toutes les classes de taille
  display.classList.remove('text-6xl', 'text-5xl', 'text-4xl', 'text-3xl', 'text-2xl', 'text-xl', 'text-lg', 'text-base');
  
  // Appliquer la classe appropriée
  if (length <= 8) {
    display.classList.add('text-6xl');
  } else if (length <= 10) {
    display.classList.add('text-5xl');
  } else if (length <= 12) {
    display.classList.add('text-4xl');
  } else if (length <= 16) {
    display.classList.add('text-3xl');
  } else if (length <= 20) {
    display.classList.add('text-2xl');
  } else if (length <= 25) {
    display.classList.add('text-xl');
  } else if (length <= 30) {
    display.classList.add('text-lg');
  } else {
    display.classList.add('text-base');
  }
};

// Fonction pour mettre à jour l'affichage
const updateDisplay = () => {
  let displayValue = currentExpression;
  
  // Si c'est un nombre (pas une expression en cours de saisie avec des opérateurs)
  if (!isNaN(parseFloat(displayValue)) && isFinite(displayValue)) {
    // Tronquer le nombre si nécessaire
    displayValue = truncateNumber(displayValue);
  }
  
  // Mettre à jour l'affichage
  display.textContent = displayValue;
  
  // Ajuster la taille de la police selon la longueur
  adjustFontSize();
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

// Fonction pour gérer les erreurs de calcul
const handleCalculationError = (errorMessage) => {
  console.error("Erreur de calcul:", errorMessage);
  currentExpression = 'Erreur';
  updateDisplay();
  
  // Changer le bouton en AC
  acButton.textContent = 'AC';
  
  // Utiliser les classes Tailwind pour l'animation de secousse
  display.classList.add('text-red-500', 'animate-shake');
  
  setTimeout(() => {
    display.classList.remove('text-red-500', 'animate-shake');
  }, 500);
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
    
    // Indication visuelle uniquement (sans blocage) quand l'expression devient longue
    if (currentExpression.length >= 20) {
      display.classList.add('text-amber-400');
      setTimeout(() => {
        display.classList.remove('text-amber-400');
      }, 300);
    }
  }
  
  // Mettre à jour l'affichage
  updateDisplay();
};