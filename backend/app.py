from flask import Flask, request, jsonify
from sympy import sympify
from flask_cors import CORS

app = Flask(__name__)
# Configuration plus explicite de CORS
CORS(app, resources={r"/*": {"origins": "*", "methods": ["GET", "POST", "OPTIONS"]}})

@app.route('/')
def home():
    return "Bienvenue sur l'API de la calculatrice !"

@app.route('/calculate', methods=["POST", "OPTIONS"])  # Ajouter OPTIONS à la liste des méthodes
def calculate():
    # Gérer explicitement les requêtes OPTIONS
    if request.method == "OPTIONS":
        return "", 200
        
    try:
        data = request.get_json()
        expression = data.get("expression", "")
        result = sympify(expression)
        return jsonify({"result": float(result)})
    except Exception as e:
        return jsonify({"error": str(e)}), 400

if __name__ == '__main__':
    app.run(debug=True)