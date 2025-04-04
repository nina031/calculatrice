// Import CSS
import './style.css'

// Define constants for calculator actions
const ACTIONS = {
  AC: 'AC',
  BACKSPACE: '⌫',    // Backspace button
  EQUALS: '=',
  TOGGLE_SIGN: '+/-',
  PERCENT: '%'
};

// Select DOM elements
const display = document.querySelector('#display div');
const buttons = document.querySelectorAll('.btn');

// Variable to store calculator state
let currentExpression = '0';

// Format numbers for display with appropriate precision
const formatNumber = (number) => {
  // Convert to number for processing
  const num = typeof number === 'string' ? parseFloat(number) : number;
  
  // If it's an integer, no need for decimals
  if (Number.isInteger(num)) {
    // If the number is too large, use scientific notation
    if (Math.abs(num) >= 1e10) {
      return num.toExponential(4);
    }
    return num.toString();
  }
  
  // For decimal numbers
  const numStr = num.toString();
  
  // If already in scientific notation
  if (numStr.includes('e')) {
    const [mantissa, exponent] = numStr.split('e');
    const formattedMantissa = parseFloat(mantissa).toFixed(4);
    return `${formattedMantissa}e${exponent}`;
  }
  
  // For normal decimal numbers
  const [integer, decimal] = numStr.split('.');
  
  // If the integer part is already long
  if (integer.length > 10) {
    return num.toExponential(4);
  }
  
  // Limit decimals based on integer part length
  const maxDecimalLength = Math.max(0, 10 - integer.length);
  return parseFloat(num.toFixed(maxDecimalLength)).toString();
};

// Adjust text size based on content length
const adjustFontSize = () => {
  const displayText = display.textContent;
  const length = displayText.length;
  
  // Remove all size classes
  display.classList.remove('text-6xl', 'text-5xl', 'text-4xl', 'text-3xl', 'text-2xl', 'text-xl', 'text-lg', 'text-base');
  
  // Apply appropriate class based on text length
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

// Update the display with current expression
const updateDisplay = () => {
  let displayValue = currentExpression;
  
  // If it's a number (not an expression being entered with operators)
  if (!isNaN(parseFloat(displayValue)) && isFinite(displayValue)) {
    // Format the number if needed
    displayValue = formatNumber(displayValue);
  }
  
  // Update the display
  display.textContent = displayValue;
  
  // Adjust font size based on length
  adjustFontSize();
};

// Extract the last number from an expression
function extractLastNumber(expression) {
  const match = expression.match(/(-?\d+\.?\d*)$/);
  return match ? parseFloat(match[0]) : null;
}

// Replace the last number in an expression with a new value
function replaceLastNumber(expression, newValue) {
  return expression.replace(/(-?\d+\.?\d*)$/, formatNumber(newValue));
}

// Toggle the sign of a number in the expression
const toggleNumberSign = (expression) => {
  // If the expression is just "0", do nothing
  if (expression === '0') return expression;
  
  // If the entire expression is a number, toggle its sign
  if (!isNaN(parseFloat(expression)) && isFinite(expression)) {
    const number = parseFloat(expression);
    if (number > 0) {
      return `(-${number})`;
    } else if (number < 0) {
      return Math.abs(number).toString();
    }
    return expression;
  }
  
  // Find the last number in the expression
  const lastNumberRegex = /(-?\d+\.?\d*)$/;
  const match = expression.match(lastNumberRegex);
  
  if (match) {
    const lastNumber = match[0];
    if (lastNumber.startsWith('-')) {
      return expression.replace(lastNumberRegex, lastNumber.substring(1));
    } else {
      return expression.replace(lastNumberRegex, `(-${lastNumber})`);
    }
  }
  
  return expression;
};

// Prepare expression for the API by replacing display symbols with operators
const prepareExpressionForAPI = (expression) => {
  return expression
    .replace(/×/g, '*')  // Replace × with *
    .replace(/,/g, '.') // Replace , with .
    .replace(/÷/g, '/'); // Replace ÷ with /
};

// Handle calculation errors with visual feedback
const handleCalculationError = (errorMessage) => {
  console.error("Calculation error:", errorMessage);
  currentExpression = 'Error';
  updateDisplay();
  
  // Use Tailwind classes for shake animation
  display.classList.add('text-red-500', 'animate-shake');
  
  setTimeout(() => {
    display.classList.remove('text-red-500', 'animate-shake');
  }, 500);
};

// Calculate the result via the API
const calculateResult = () => {
  const expressionForAPI = prepareExpressionForAPI(currentExpression);
  console.log("Expression sent to API:", expressionForAPI);
  
  // Use API URL from environment variables
  const apiUrl = import.meta.env.VITE_API_URL;
  
  fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ expression: expressionForAPI })
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    console.log("API Response:", data);
    
    if (data.error) {
      throw new Error(data.error);
    }
    
    currentExpression = formatNumber(data.result);
    updateDisplay();
  })
  .catch(error => {
    handleCalculationError(error.message);
  });
};

// Handle button clicks
const handleButtonClick = (value) => {
  console.log("Button clicked:", value);
  
  switch (value) {
    case ACTIONS.EQUALS:
      calculateResult();
      break;
      
    case ACTIONS.AC:
      // Reset the expression
      currentExpression = '0';
      break;
      
    case ACTIONS.BACKSPACE:
      // Delete one character
      currentExpression = currentExpression.length === 1 ? '0' : currentExpression.slice(0, -1);
      break;
      
    case ACTIONS.TOGGLE_SIGN:
      currentExpression = toggleNumberSign(currentExpression);
      break;
      
    case ACTIONS.PERCENT:
      const lastNumber = extractLastNumber(currentExpression);
      if (lastNumber) {
        const percentValue = lastNumber / 100;
        currentExpression = replaceLastNumber(currentExpression, percentValue);
      }
      break;
      
    default:
      // For digits and operators
      if (currentExpression === '0') {
        currentExpression = value;
      } else {
        currentExpression += value;
        
        // Visual indication for long expressions
        if (currentExpression.length >= 20) {
          display.classList.add('text-amber-400');
          setTimeout(() => {
            display.classList.remove('text-amber-400');
          }, 300);
        }
      }
  }
  
  // Update the display
  updateDisplay();
};

// Add event listener to each button
buttons.forEach(button => {
  button.addEventListener('click', () => {
    const value = button.textContent;
    handleButtonClick(value);
  });
});

// Initialize the display
updateDisplay();