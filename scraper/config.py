import os
from pathlib import Path
from dotenv import load_dotenv

# Carrega o arquivo .env local ou da pasta pai (se aplicável)
BASE_DIR = Path(__file__).resolve().parent
ENV_PATH = BASE_DIR / '.env'

if ENV_PATH.exists():
    load_dotenv(ENV_PATH)
else:
    # Fallback para tentar ler o .env do backend se estiver rodando integrado
    PARENT_ENV = BASE_DIR.parent / 'backend' / '.env'
    if PARENT_ENV.exists():
        load_dotenv(PARENT_ENV)
    else:
        load_dotenv()  # Carrega das variáveis globais do sistema

# Configurações mapeadas
DATABASE_URL = os.getenv("DATABASE_URL")
LINKEDIN_EMAIL = os.getenv("LINKEDIN_EMAIL", "")
LINKEDIN_PASSWORD = os.getenv("LINKEDIN_PASSWORD", "")
HEADLESS = os.getenv("HEADLESS", "False").lower() in ("true", "1", "yes")

# Configuração do diretório de dados do Chrome (Profile)
CHROME_USER_DATA_DIR = os.getenv("CHROME_USER_DATA_DIR", "")
if not CHROME_USER_DATA_DIR:
    # Se não especificado, cria um diretório local para persistência de cookies
    profile_dir = BASE_DIR / "chrome_profile"
    profile_dir.mkdir(exist_ok=True)
    CHROME_USER_DATA_DIR = str(profile_dir)

# Configurações de integração com a API NestJS
INTEGRATION_MODE = os.getenv("INTEGRATION_MODE", "API").upper()
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:5000")
SCRAPER_API_TOKEN = os.getenv("SCRAPER_API_TOKEN", "")

def validate_config():
    """Valida as configurações mínimas requeridas."""
    if not DATABASE_URL:
        print("[WARNING] DATABASE_URL não encontrada. Os resultados serão salvos apenas em formato local (JSON/CSV).")
    if not LINKEDIN_EMAIL or not LINKEDIN_PASSWORD:
        print("[WARNING] Credenciais do LinkedIn não configuradas no .env. Scraping do LinkedIn pode falhar ou exigir intervenção.")
