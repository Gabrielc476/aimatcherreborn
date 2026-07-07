import sys
import os
import traceback
import subprocess

print("=== DIAGNÓSTICO DE AMBIENTE ===")
print(f"Python Version: {sys.version}")
print(f"Plataforma: {sys.platform}")

# 1. Verifica se undetected_chromedriver está instalado
try:
    import undetected_chromedriver as uc
    print("[OK] undetected_chromedriver importado com sucesso.")
except ImportError:
    print("[ERRO] undetected_chromedriver NÃO está instalado!")
    traceback.print_exc()

# 2. Localiza chrome.exe no Windows
paths = [
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    os.path.expandvars(r"%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe")
]

chrome_found = False
for path in paths:
    if os.path.exists(path):
        print(f"[OK] Chrome encontrado em: {path}")
        chrome_found = True
        break

if not chrome_found:
    print("[ERRO] Não foi possível encontrar o chrome.exe nos caminhos padrão do Windows!")
    print("Verifique se você possui o Google Chrome instalado no seu computador.")

# 3. Tenta ler o registro
try:
    import winreg
    key = winreg.OpenKey(winreg.HKEY_CURRENT_USER, r"Software\Google\Chrome\BLBeacon")
    version, _ = winreg.QueryValueEx(key, "version")
    print(f"[OK] Versão do Chrome no Registro: {version}")
except Exception as e:
    print(f"[AVISO] Erro ao ler versão no registro: {e}")

# 4. Tenta iniciar o driver mínimo
if chrome_found:
    print("\nTentando inicializar o navegador de teste...")
    try:
        options = uc.ChromeOptions()
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        
        # Tenta pegar versão
        try:
            major_version = int(version.split(".")[0])
            print(f"Usando version_main={major_version}")
            driver = uc.Chrome(options=options, version_main=major_version)
        except:
            print("Usando detecção automática de versão do uc")
            driver = uc.Chrome(options=options)
            
        driver.get("https://www.google.com")
        print(f"[OK] Navegador aberto com sucesso. Título da página: {driver.title}")
        driver.quit()
    except Exception as e:
        print("[ERRO CRÍTICO] Falha ao abrir o Chrome via Selenium:")
        traceback.print_exc()
else:
    print("\n[ERRO] Abortando teste de inicialização do driver pois o Chrome não foi encontrado.")
