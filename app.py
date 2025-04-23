from flask import Flask
from rotas.usuario_rotas import usuario_bp
from banco_de_dados.conexao import conectar_mongodb
import os
from dotenv import load_dotenv
from rotas.curriculo_rotas import curriculo_bp
from rotas.vaga_rotas import vaga_bp
from rotas.matching_rotas import matching_bp
# Carrega variáveis de ambiente
load_dotenv()

# Cria a aplicação Flask
app = Flask(__name__)

# Configura o segredo para JWT
app.config['JWT_SECRET'] = os.getenv('JWT_SECRET', 'chave_secreta_para_desenvolvimento')
app.config['ANTHROPIC_API_KEY'] = os.getenv('ANTHROPIC_API_KEY')

try:
    # Conecta ao MongoDB usando a URL do arquivo .env
    cliente_mongo, db = conectar_mongodb()

    # Compartilha a conexão do banco de dados com a aplicação
    app.config['MONGODB_CLIENT'] = cliente_mongo
    app.config['MONGODB_DB'] = db

    print("Conexão com MongoDB estabelecida com sucesso")
except Exception as e:
    print(f"Erro ao conectar ao MongoDB: {str(e)}")
    print("A aplicação continuará sem conexão com o banco de dados")

# Registra o Blueprint de usuários
app.register_blueprint(usuario_bp, url_prefix='/usuario')
app.register_blueprint(curriculo_bp, url_prefix='/curriculo')
app.register_blueprint(vaga_bp, url_prefix='/vaga')
app.register_blueprint(matching_bp, url_prefix='/matching')

# Rota principal para verificar se a aplicação está funcionando
@app.route('/')
def index():
    if 'MONGODB_DB' in app.config:
        return "API de Matching de Currículos funcionando com MongoDB conectado!"
    else:
        return "API de Matching de Currículos funcionando (sem conexão com MongoDB)!"






# Inicia o servidor quando executado diretamente
if __name__ == '__main__':
    app.run(debug=True)