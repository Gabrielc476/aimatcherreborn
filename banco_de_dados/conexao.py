import os
from pymongo import MongoClient
from dotenv import load_dotenv


def conectar_mongodb():
    """
    Função para conectar ao MongoDB usando a URL de conexão do arquivo .env

    Retorna:
        tuple: (cliente, banco_dados)
    """
    try:
        # Carrega as variáveis do arquivo .env
        load_dotenv()

        # Obtém a URL de conexão do MongoDB
        mongo_url = os.getenv('MONGO_DB_URI')

        if not mongo_url:
            raise ValueError("A URL de conexão com o MongoDB não está definida no arquivo .env")

        # Conecta ao MongoDB usando a URL completa
        cliente = MongoClient(mongo_url)


        # Acessa o banco de dados
        db = cliente.get_database()

        print(f"Conexão estabelecida com o MongoDB")
        return cliente, db

    except Exception as e:
        print(f"Erro ao conectar ao MongoDB: {str(e)}")
        raise