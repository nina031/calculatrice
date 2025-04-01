// Importation du CSS
import './style.css'

// Sélectionner les éléments du DOM
const display = document.querySelector('#display div');
const buttons = document.querySelectorAll('.btn');

// Initialiser l'affichage
display.textContent = '0';

// Ajouter un écouteur d'événements à chaque bouton
buttons.forEach(button => {
  button.addEventListener('click', () => {
    console.log('Bouton cliqué:', button.textContent);
    // Pour tester l'affichage, remplaçons le contenu par la valeur du bouton
    display.textContent = button.textContent;
  });
});