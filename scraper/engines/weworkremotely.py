from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from engines.base import BaseEngine
import urllib.parse

class WeWorkRemotelyEngine(BaseEngine):
    def __init__(self):
        super().__init__(name="weworkremotely")

    def scrape(self, query, limit=10):
        """Busca vagas no WeWorkRemotely baseado no termo fornecido."""
        self.init_driver()
        vagas = []
        
        encoded_query = urllib.parse.quote(query)
        url = f"https://weworkremotely.com/remote-jobs/search?term={encoded_query}"
        print(f"[{self.name.upper()}] Acessando URL de busca: {url}")
        
        try:
            self.driver.get(url)
            self.random_sleep(3, 5)
            
            # Localiza os elementos das vagas
            # A estrutura típica é: <section class="jobs"> ... <li class="feature"> ou <li> contendo links
            job_links = []
            elements = self.driver.find_elements(By.CSS_SELECTOR, "section.jobs article ul li a")
            
            for elem in elements:
                href = elem.get_attribute("href")
                if href and "/remote-jobs/" in href and not href.endswith("/remote-jobs/"):
                    # Evita duplicar links na mesma página
                    if href not in job_links:
                        job_links.append(href)
                        if len(job_links) >= limit:
                            break
            
            print(f"[{self.name.upper()}] Encontrados {len(job_links)} links de vagas para detalhar.")
            
            # Acessa cada link para pegar a descrição detalhada
            for index, job_url in enumerate(job_links):
                try:
                    print(f"[{self.name.upper()}] Detalhando vaga {index + 1}/{len(job_links)}: {job_url}")
                    self.driver.get(job_url)
                    self.random_sleep(2, 4)
                    
                    # Título
                    try:
                        titulo = self.driver.find_element(By.CSS_SELECTOR, ".lis-container__header__hero__company-info__title").text.strip()
                    except:
                        titulo = query + " Developer"  # Fallback
                    
                    # Empresa
                    try:
                        empresa = self.driver.find_element(By.CSS_SELECTOR, ".lis-container__job__sidebar__companyDetails__info__title h3").text.strip()
                    except:
                        empresa = "Não Informada"
                    
                    # Descrição
                    try:
                        descricao = self.driver.find_element(By.CSS_SELECTOR, ".lis-container__job__content__description").text.strip()
                    except:
                        descricao = "Sem descrição detalhada disponível."
                    
                    # Localização e Tipo de Contrato
                    localizacao = "Remoto"
                    try:
                        regiao = self.driver.find_element(By.CSS_SELECTOR, ".box--region").text.strip()
                        localizacao = f"Remoto ({regiao})"
                    except:
                        pass
                    
                    # Mapeia tipo de contrato (WWR costuma indicar Full-Time ou Contract)
                    tipo_contrato = "PJ"  # Padrão para vagas internacionais remotas
                    try:
                        job_type_elem = self.driver.find_element(By.CSS_SELECTOR, ".box--jobType")
                        text = job_type_elem.text.lower()
                        if "full-time" in text or "tempo integral" in text:
                            tipo_contrato = "CLT / PJ"
                        elif "contract" in text or "pj" in text or "contrato" in text:
                            tipo_contrato = "PJ"
                    except:
                        pass
                    
                    vaga_info = {
                        "titulo": titulo,
                        "empresa": empresa,
                        "descricao": descricao,
                        "localizacao": localizacao,
                        "modalidade": "REMOTO",
                        "tipo_contrato": tipo_contrato,
                        "nivel": "Pleno",  # Padrão, mas pode ser inferido do título
                        "salario_min": None,
                        "salario_max": None,
                        "origem": "WeWorkRemotely",
                        "link": job_url
                    }
                    
                    # Simples dedução de nível pelo título
                    tit_lower = titulo.lower()
                    if any(x in tit_lower for x in ["senior", "sr", "lead", "principal"]):
                        vaga_info["nivel"] = "Senior"
                    elif any(x in tit_lower for x in ["junior", "jr", "entry", "intern"]):
                        vaga_info["nivel"] = "Junior"
                    
                    vagas.append(vaga_info)
                    
                except Exception as inner_e:
                    print(f"[{self.name.upper()}] Erro ao raspar dados da vaga {job_url}: {inner_e}")
                    continue
                    
        except Exception as e:
            print(f"[{self.name.upper()}] Erro durante o scraping: {e}")
        finally:
            self.close()
            
        return vagas
