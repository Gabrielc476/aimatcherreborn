from selenium.webdriver.common.by import By
from engines.base import BaseEngine
import urllib.parse

class IndeedEngine(BaseEngine):
    def __init__(self):
        super().__init__(name="indeed")

    def scrape(self, query, limit=10):
        """Busca vagas no Indeed Brasil baseado no termo fornecido."""
        self.init_driver()
        vagas = []
        
        encoded_query = urllib.parse.quote(query)
        # Usando Indeed Brasil por padrão
        url = f"https://br.indeed.com/jobs?q={encoded_query}"
        print(f"[{self.name.upper()}] Acessando URL de busca: {url}")
        
        try:
            self.driver.get(url)
            self.random_sleep(4, 6)
            
            # Tenta fechar popups de login se surgirem
            try:
                close_btn = self.driver.find_element(By.CSS_SELECTOR, "button.icl-CloseButton")
                close_btn.click()
                print("[{self.name.upper()}] Pop-up de login fechado.")
            except:
                pass
                
            # Localiza os cards de vagas para extrair o Job Key (data-jk)
            job_keys = []
            
            # No Indeed, os cards de vagas costumam ter o atributo data-jk
            cards = self.driver.find_elements(By.CSS_SELECTOR, "[data-jk]")
            for card in cards:
                jk = card.get_attribute("data-jk")
                if jk and jk not in job_keys:
                    job_keys.append(jk)
                    if len(job_keys) >= limit:
                        break
            
            # Se não encontrar por data-jk, tenta pegar links que apontam para viewjob
            if not job_keys:
                links = self.driver.find_elements(By.TAG_NAME, "a")
                for link in links:
                    href = link.get_attribute("href")
                    if href and "jk=" in href:
                        # Extrai o valor de jk
                        try:
                            jk = href.split("jk=")[1].split("&")[0]
                            if jk not in job_keys:
                                job_keys.append(jk)
                                if len(job_keys) >= limit:
                                    break
                        except:
                            pass
            
            print(f"[{self.name.upper()}] Encontradas {len(job_keys)} chaves de vagas (Job Keys) para detalhar.")
            
            # Detalha cada vaga acessando a URL limpa de visualização
            for index, jk in enumerate(job_keys):
                job_url = f"https://br.indeed.com/viewjob?jk={jk}"
                try:
                    print(f"[{self.name.upper()}] Detalhando vaga {index + 1}/{len(job_keys)}: {job_url}")
                    self.driver.get(job_url)
                    self.random_sleep(3, 5)
                    
                    # Título
                    try:
                        titulo = self.driver.find_element(By.CSS_SELECTOR, "h1.jobsearch-JobInfoHeader-title").text.strip()
                    except:
                        try:
                            titulo = self.driver.find_element(By.CSS_SELECTOR, "h2.jobsearch-JobInfoHeader-title").text.strip()
                        except:
                            titulo = query + " Developer"
                    
                    # Empresa
                    try:
                        # Procura pelo link ou div da empresa
                        empresa = self.driver.find_element(By.CSS_SELECTOR, "div[data-company-name='true']").text.strip()
                    except:
                        try:
                            empresa = self.driver.find_element(By.CSS_SELECTOR, ".jobsearch-InlineCompanyRating").text.strip()
                            # Limpa classificação se vier junto (ex: 'Google 4.5')
                            if "\n" in empresa:
                                empresa = empresa.split("\n")[0]
                        except:
                            empresa = "Não Informada"
                    
                    # Descrição
                    try:
                        descricao = self.driver.find_element(By.ID, "jobDescriptionText").text.strip()
                    except:
                        descricao = "Sem descrição detalhada disponível no Indeed."
                    
                    # Localização e Modalidade
                    localizacao = "Brasil"
                    modalidade = "REMOTO"
                    
                    try:
                        # Localização costuma estar no header
                        sub_text = self.driver.find_element(By.CSS_SELECTOR, ".jobsearch-JobInfoHeader-subtitle").text
                        # Ex: 'Google - São Paulo, SP'
                        if "-" in sub_text:
                            localizacao = sub_text.split("-")[-1].strip()
                        else:
                            localizacao = sub_text.strip()
                    except:
                        pass
                        
                    desc_lower = descricao.lower()
                    if "híbrido" in desc_lower or "hibrido" in desc_lower or "hybrid" in desc_lower:
                        modalidade = "HIBRIDO"
                    elif "presencial" in desc_lower or "no local" in desc_lower:
                        modalidade = "PRESENCIAL"
                    elif "remoto" in desc_lower or "home office" in desc_lower or "teletrabalho" in desc_lower:
                        modalidade = "REMOTO"
                    
                    # Tipo de Contrato
                    tipo_contrato = "CLT"
                    if "pj" in desc_lower or "pessoa jurídica" in desc_lower or "prestador de serviço" in desc_lower:
                        tipo_contrato = "PJ"
                    elif "clt" in desc_lower or "carteira assinada" in desc_lower:
                        tipo_contrato = "CLT"
                        
                    # Nível (Senioridade)
                    nivel = "Pleno"
                    tit_lower = titulo.lower()
                    if "sênior" in tit_lower or "senior" in tit_lower or "sr" in tit_lower or "lead" in tit_lower:
                        nivel = "Senior"
                    elif "júnior" in tit_lower or "junior" in tit_lower or "jr" in tit_lower or "estágio" in tit_lower:
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
                        "origem": "Indeed",
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
