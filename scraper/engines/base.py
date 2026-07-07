import random
import time
import undetected_chromedriver as uc
from config import HEADLESS, CHROME_USER_DATA_DIR

def get_chrome_major_version():
    """Detecta a versão principal do Chrome no Windows."""
    try:
        import winreg
        key = winreg.OpenKey(winreg.HKEY_CURRENT_USER, r"Software\Google\Chrome\BLBeacon")
        version, _ = winreg.QueryValueEx(key, "version")
        return int(version.split(".")[0])
    except Exception:
        return None

def clean_chrome_profile_locks(profile_dir):
    """Remove arquivos de lock do perfil do Chrome para evitar o erro 'chrome not reachable'."""
    if not profile_dir:
        return
    from pathlib import Path
    p = Path(profile_dir)
    if p.exists():
        # No Windows/Linux, remove o SingletonLock no raiz do perfil
        for lock_name in ["SingletonLock", "lockfile"]:
            lock_path = p / lock_name
            if lock_path.exists():
                try:
                    lock_path.unlink()
                    print(f"[BASE] Arquivo de trava '{lock_name}' removido de: {lock_path}")
                except Exception as e:
                    print(f"[BASE] Não foi possível remover a trava '{lock_name}': {e}")

class BaseEngine:
    def __init__(self, name="base"):
        self.name = name
        self.driver = None

    def init_driver(self):
        """Inicializa o undetected-chromedriver com evasão aprimorada."""
        print(f"[{self.name.upper()}] Inicializando o undetected-chromedriver...")
        
        chrome_options = uc.ChromeOptions()
        
        if HEADLESS:
            # Observação: undetected-chromedriver às vezes é mais fácil de detectar no headless padrão.
            # O headless 'new' ajuda, mas se houver bloqueios, HEADLESS deve ser desligado.
            chrome_options.add_argument("--headless=new")
        
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--disable-gpu")
        chrome_options.add_argument("--window-size=1920,1080")
        
        # Configuração da pasta de perfil (cookies e sessão persistente)
        if CHROME_USER_DATA_DIR:
            print(f"[{self.name.upper()}] Usando perfil do Chrome em: {CHROME_USER_DATA_DIR}")
            clean_chrome_profile_locks(CHROME_USER_DATA_DIR)
            chrome_options.add_argument(f"--user-data-dir={CHROME_USER_DATA_DIR}")
        
        # Detecta versão principal do Chrome para evitar conflito com o driver instalado
        chrome_version = get_chrome_major_version()
        
        # Inicializa o uc.Chrome (ele cuida do download e patch automático do ChromeDriver)
        if chrome_version:
            print(f"[{self.name.upper()}] Forçando ChromeDriver versão {chrome_version} para alinhar com o Chrome.")
            self.driver = uc.Chrome(options=chrome_options, version_main=chrome_version)
        else:
            self.driver = uc.Chrome(options=chrome_options)
        
        print(f"[{self.name.upper()}] WebDriver (undetected) inicializado com sucesso.")
        return self.driver

    def random_sleep(self, min_s=1.5, max_s=4.5):
        """Gera um tempo de espera aleatório para simular comportamento humano."""
        sleep_time = random.uniform(min_s, max_s)
        time.sleep(sleep_time)

    def scroll_to_bottom(self, steps=3, delay=1.0):
        """Realiza rolagem suave na página para carregar conteúdo dinâmico."""
        if not self.driver:
            return
        for i in range(steps):
            self.driver.execute_script("window.scrollTo(0, document.body.scrollHeight * (arguments[0]/arguments[1]));", i + 1, steps)
            time.sleep(delay)

    def close(self):
        """Fecha o WebDriver e encerra a sessão."""
        if self.driver:
            print(f"[{self.name.upper()}] Finalizando WebDriver...")
            try:
                self.driver.quit()
            except Exception as e:
                print(f"[{self.name.upper()}] Erro ao fechar driver: {e}")
            self.driver = None

    def scrape(self, query, limit=10):
        """Método abstrato a ser implementado por cada scraper."""
        raise NotImplementedError("Método scrape() deve ser implementado na subclasse.")
