from selenium.webdriver.common.by import By
from engines.base import BaseEngine
import urllib.parse

class InfoJobsEngine(BaseEngine):
    def __init__(self):
        super().__init__(name="infojobs")

    def scrape(self, query, limit=10):
        """Busca vagas no InfoJobs Brasil baseado no termo fornecido."""
        self.init_driver()
        vagas = []
        
        encoded_query = urllib.parse.quote(query)
        url = f"https://www.infojobs.com.br/empregos.aspx?palavra={encoded_query}"
        print(f"[{self.name.upper()}] Acessando URL de busca: {url}")
        
        try:
            self.driver.get(url)
            self.random_sleep(4, 6)
            
            # Aceita cookies se surgir o banner para liberar a visualização
            try:
                cookie_btn = self.driver.find_element(By.CSS_SELECTOR, "#didomi-notice-agree-button, .js_cookieAgree, button[id*='cookie']")
                cookie_btn.click()
                print(f"[{self.name.upper()}] Banner de cookies aceito.")
            except:
                pass
                
            # Localiza links que apontam para páginas de vaga
            # Exemplo de URL no Infojobs: https://www.infojobs.com.br/vaga-de-desenvolvedor-python-em-sao-paulo-sp__123456.aspx
            job_links = []
            links = self.driver.find_elements(By.TAG_NAME, "a")
            
            for link in links:
                href = link.get_attribute("href")
                if href and "/vaga-de-" in href and href.endswith(".aspx"):
                    if href not in job_links:
                        job_links.append(href)
                        if len(job_links) >= limit:
                            break
            
            print(f"[{self.name.upper()}] Encontrados {len(job_links)} links de vagas para detalhar.")
            
            # Detalha cada vaga
            for index, job_url in enumerate(job_links):
                try:
                    print(f"[{self.name.upper()}] Detalhando vaga {index + 1}/{len(job_links)}: {job_url}")
                    self.driver.get(job_url)
                    self.random_sleep(3, 5)
                    
                    # Título
                    try:
                        titulo = self.driver.find_element(By.CSS_SELECTOR, "h1, .h1, [class*='title']").text.strip()
                    except:
                        titulo = query + " Developer"
                    
                    # Empresa
                    try:
                        empresa_elem = self.driver.find_elements(By.CSS_SELECTOR, "[class*='company'], [class*='empresa'], .js_company")
                        empresa = "Não Informada"
                        for elem in empresa_elem:
                            text = elem.text.strip()
                            if text and "infojobs" not in text.lower() and len(text) < 100:
                                empresa = text
                                break
                    except:
                        empresa = "Não Informada"
                    
                    # Descrição
                    try:
                        desc_elem = self.driver.find_element(By.CSS_SELECTOR, ".description, [class*='description'], [class*='descricao']").text.strip()
                    except:
                        try:
                            # Caso não ache por classe, tenta pegar o corpo do texto de div principal
                            desc_elem = self.driver.find_element(By.CSS_SELECTOR, "div.content, div.main-content").text.strip()
                        except:
                            desc_elem = "Sem descrição detalhada disponível."
                    
                    # Localização e Modalidade
                    localizacao = "Brasil"
                    modalidade = "REMOTO"
                    
                    try:
                        loc_text = self.driver.find_element(By.CSS_SELECTOR, "[class*='location'], [class*='cidade'], [class*='local']").text.strip()
                        localizacao = loc_text
                    except:
                        pass
                        
                    desc_lower = desc_elem.lower()
                    page_text = self.driver.find_element(By.TAG_NAME, "body").text.lower()
                    
                    if "híbrido" in page_text or "hibrido" in page_text or "híbrida" in page_text:
                        modalidade = "HIBRIDO"
                    elif "presencial" in page_text:
                        modalidade = "PRESENCIAL"
                    elif "remoto" in page_text or "home office" in page_text or "teletrabalho" in page_text:
                        modalidade = "REMOTO"
                    
                    # Tipo de Contrato
                    tipo_contrato = "CLT"
                    if "pj" in page_text or "pessoa jurídica" in page_text:
                        tipo_contrato = "PJ"
                    elif "clt" in page_text:
                        tipo_contrato = "CLT"
                    
                    # Nível (Senioridade)
                    nivel = "Pleno"
                    tit_lower = titulo.lower()
                    if "sênior" in tit_lower or "senior" in tit_lower or "sr" in tit_lower:
                        nivel = "Senior"
                    elif "júnior" in tit_lower or "junior" in tit_lower or "jr" in tit_lower:
                        nivel = "Junior"
                        
                    vaga_info = {
                        "titulo": titulo,
                        "empresa": empresa,
                        "descricao": desc_elem,
                        "localizacao": localizacao,
                        "modalidade": modalidade,
                        "tipo_contrato": tipo_contrato,
                        "nivel": nivel,
                        "salario_min": None,
                        "salario_max": None,
                        "origem": "InfoJobs",
                        "link": job_url
                    }
                    
                    vagas.append(vaga_info)
                    
                except Exception as inner_e:
                    print(f"[{self.name.upper()}] Erro ao detalhar vaga {job_url}: {inner_e}")
                    continue
                    
        except Exception as e:
            print(f"[{self.name.upper()}] Erro geral durante scraping: {e}")
        finally:
            self.close()
            
        return vagas
