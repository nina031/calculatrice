from flask import Flask, request, jsonify
from sympy import sympify

app = Flask(__name__)

@app.route('/')
def home():
    return "Bienvenue sur l'API de la calculatrice !"

@app.route('/calculate', methods=["POST"])

def calculate():
    try:
        data = request.get_json()
        expression = data.get("expression", "")
        result = sympify(expression)
        return jsonify({"result": float(result)})
    except Exception as e:
        return jsonify({"error":str(e)}), 400

if __name__ == '__main__':
    app.run(debug=True)
