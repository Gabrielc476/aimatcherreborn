from selenium.webdriver.common.by import By
from engines.base import BaseEngine
import urllib.parse

class NerdinEngine(BaseEngine):
    def __init__(self):
        super().__init__(name="nerdin")

    def scrape(self, query, limit=10):
        """Busca vagas no Nerdin baseado na tecnologia fornecida."""
        self.init_driver()
        vagas = []
        
        # O Nerdin usa o parâmetro 'Plataforma' para filtrar por tecnologia
        encoded_query = urllib.parse.quote(query)
        url = f"https://www.nerdin.com.br/vagas?Plataforma={encoded_query}"
        print(f"[{self.name.upper()}] Acessando URL de busca: {url}")
        
        try:
            self.driver.get(url)
            self.random_sleep(3, 5)
            
            # Encontra todos os links da página
            links = self.driver.find_elements(By.TAG_NAME, "a")
            job_links = []
            
            for link in links:
                href = link.get_attribute("href")
                if href and "/vaga/" in href:
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
                    self.random_sleep(2, 4)
                    
                    # Título
                    try:
                        titulo = self.driver.find_element(By.CSS_SELECTOR, "h1").text.strip()
                    except:
                        titulo = query + " Developer"
                    
                    # Empresa
                    try:
                        # Tenta encontrar a empresa. Geralmente há elementos com texto 'Empresa:'
                        empresa_elements = self.driver.find_elements(By.XPATH, "//*[contains(text(), 'Empresa') or contains(text(), 'Contratante')]")
                        empresa = "Não Informada"
                        for elem in empresa_elements:
                            parent_text = elem.find_element(By.XPATH, "..").text
                            if ":" in parent_text:
                                empresa = parent_text.split(":", 1)[1].strip()
                                break
                    except:
                        empresa = "Não Informada"
                        
                    # Descrição
                    try:
                        # Procura por elementos que costumam conter o corpo do texto
                        desc_elements = self.driver.find_elements(By.CSS_SELECTOR, ".descricao, .texto, [class*='vaga-detalhes'], [class*='description'], article")
                        descricao = ""
                        for elem in desc_elements:
                            text = elem.text.strip()
                            if len(text) > len(descricao):
                                descricao = text
                        
                        if not descricao:
                            # Se não achou por classe, pega o texto do elemento pai principal ou do body filtrado
                            body_text = self.driver.find_element(By.TAG_NAME, "body").text
                            # Pega uma seção aproximada da página
                            lines = body_text.split("\n")
                            # Filtra linhas para tentar pegar o miolo
                            descricao = "\n".join(lines[15:80]) if len(lines) > 80 else body_text
                    except:
                        descricao = "Sem descrição detalhada disponível."
                    
                    # Localização e Modalidade
                    localizacao = "Brasil"
                    modalidade = "REMOTO"
                    
                    page_text = self.driver.find_element(By.TAG_NAME, "body").text.lower()
                    if "híbrido" in page_text or "hibrido" in page_text:
                        modalidade = "HIBRIDO"
                    elif "presencial" in page_text:
                        modalidade = "PRESENCIAL"
                    elif "home office" in page_text or "remoto" in page_text:
                        modalidade = "REMOTO"
                        
                    try:
                        loc_elements = self.driver.find_elements(By.XPATH, "//*[contains(text(), 'Local') or contains(text(), 'Cidade') or contains(text(), 'UF')]")
                        for elem in loc_elements:
                            parent_text = elem.find_element(By.XPATH, "..").text
                            if ":" in parent_text:
                                localizacao = parent_text.split(":", 1)[1].strip()
                                break
                    except:
                        pass
                    
                    # Tipo de contrato
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
                        "descricao": descricao,
                        "localizacao": localizacao,
                        "modalidade": modalidade,
                        "tipo_contrato": tipo_contrato,
                        "nivel": nivel,
                        "salario_min": None,
                        "salario_max": None,
                        "origem": "Nerdin",
                        "link": job_url
                    }
                    
                    vagas.append(vaga_info)
                    
                except Exception as inner_e:
                    print(f"[{self.name.upper()}] Erro ao detalhar vaga {job_url}: {inner_e}")
                    continue
                    
        except Exception as e:
            print(f"[{self.name.upper()}] Erro durante o scraping: {e}")
        finally:
            self.close()
            
        return vagas
