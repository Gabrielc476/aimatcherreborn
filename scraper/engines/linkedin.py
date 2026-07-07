import time
import urllib.parse
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from engines.base import BaseEngine
from config import LINKEDIN_EMAIL, LINKEDIN_PASSWORD

class LinkedInEngine(BaseEngine):
    # Selectors for sidebar list container
    SIDEBAR_SELECTORS = [
        "ul.scaffold-layout__list-container",
        ".jobs-search-results-list",
        ".jobs-search-results-list__list",
        ".scaffold-layout__list",
        "[class*='jobs-search-results-list']"
    ]
    
    # Selectors for job cards in list
    CARD_SELECTORS = [
        "[data-occludable-job-id]",
        "[data-job-id]",
        ".job-card-container",
        "[class*='job-card-container']"
    ]
    
    # Selectors for job description
    DESCRIPTION_SELECTORS = [
        "[data-testid='expandable-text-box']",
        "[data-testid*='expandable-text']",
        "#job-details",
        ".jobs-description__content",
        ".jobs-description-content__text",
        ".show-more-less-html__markup",
        "article"
    ]
    
    # Selectors for login form
    LOGIN_USERNAME_SELECTOR = "input[type='email'], input[autocomplete*='username'], input#username"
    LOGIN_PASSWORD_SELECTOR = "input[type='password'], input[autocomplete*='password'], input#password"
    LOGIN_SUBMIT_XPATH = (
        "//button[@type='submit'] | "
        "//button[contains(., 'Entrar')] | "
        "//button[contains(., 'Sign in')] | "
        "//button[contains(., 'Log in')]"
    )
    
    # Selectors for expanding the description
    EXPAND_BUTTON_XPATH = (
        "//button[contains(., 'Exibir mais') or contains(., 'Show more') or "
        "contains(., 'ver mais') or contains(., 'mais') or contains(., 'more')]"
    )

    def __init__(self):
        super().__init__(name="linkedin")

    def _log(self, message, level="INFO"):
        """Centraliza o formato das mensagens de log do scraper."""
        print(f"[{self.name.upper()}] [{level}] {message}")

    def check_logged_in(self):
        """Verifica se a sessão já está logada consultando a URL atual."""
        try:
            self.driver.get("https://www.linkedin.com/feed/")
            self.random_sleep(2, 4)
            current_url = self.driver.current_url.split("?")[0]
            if current_url.endswith("/feed") or current_url.endswith("/feed/"):
                self._log("Sessão ativa de login detectada.")
                return True
        except Exception as e:
            self._log(f"Erro ao verificar sessão: {e}", "WARNING")
        return False

    def get_visible_element(self, by, selector, timeout=10):
        """Espera e retorna o primeiro elemento correspondente que esteja visível na página."""
        start_time = time.time()
        while time.time() - start_time < timeout:
            elements = self.driver.find_elements(by, selector)
            for elem in elements:
                try:
                    if elem.is_displayed() and elem.is_enabled():
                        return elem
                except:
                    pass
            time.sleep(0.5)
        raise Exception(f"Elemento visível não encontrado para o seletor: {selector}")

    def login(self):
        """Realiza o login no LinkedIn usando credenciais do .env."""
        if self.check_logged_in():
            return True
            
        self._log("Acessando página de login...")
        self.driver.get("https://www.linkedin.com/login")
        self.random_sleep(3, 5)
        
        if not LINKEDIN_EMAIL or not LINKEDIN_PASSWORD:
            self._log("E-mail ou senha do LinkedIn não fornecidos no .env!", "ERROR")
            self._log("Por favor, configure as credenciais para prosseguir.", "ERROR")
            return False
            
        try:
            # Localiza o campo de e-mail visível
            username_field = self.get_visible_element(By.CSS_SELECTOR, self.LOGIN_USERNAME_SELECTOR)
            username_field.clear()
            username_field.send_keys(LINKEDIN_EMAIL)
            self.random_sleep(0.5, 1.5)
            
            # Localiza o campo de senha visível
            password_field = self.get_visible_element(By.CSS_SELECTOR, self.LOGIN_PASSWORD_SELECTOR)
            password_field.clear()
            password_field.send_keys(LINKEDIN_PASSWORD)
            self.random_sleep(0.5, 1.5)
            
            # Localiza o botão de entrar/submit visível via XPath
            submit_btn = self.get_visible_element(By.XPATH, self.LOGIN_SUBMIT_XPATH)
            submit_btn.click()
            self.random_sleep(4, 6)
            
            # Se cair em verificação de segurança (2FA ou CAPTCHA), espera o usuário resolver manualmente
            current_url = self.driver.current_url
            if any(term in current_url for term in ["checkpoint", "challenge", "login-submit", "login"]):
                self._log("Detecção de CAPTCHA, Código de Segurança (2FA) ou Login pendente!", "WARNING")
                self._log("Resolva o desafio diretamente na janela do navegador que está aberta.", "WARNING")
                self._log("O script irá aguardar até 120 segundos para que você conclua o login...", "WARNING")
                
                # Aguarda até que o usuário seja redirecionado para a página inicial (feed ou search)
                for _ in range(24):  # 24 * 5s = 120s
                    time.sleep(5)
                    url_clean = self.driver.current_url.split("?")[0]
                    if any(term in url_clean for term in ["/feed", "/search", "/jobs"]):
                        self._log("Desafio/Login concluído com sucesso.")
                        return True
                self._log("Tempo limite esgotado. Login falhou.", "ERROR")
                return False
                
            # Verifica se fomos para o feed ou se falhou
            url_clean = self.driver.current_url.split("?")[0]
            if any(term in url_clean for term in ["/feed", "/search", "/jobs"]):
                return True
            else:
                self._log(f"Redirecionamento inesperado pós-login: {self.driver.current_url}", "ERROR")
                return False
        except Exception as e:
            self._log(f"Erro durante a tentativa de login: {e}", "ERROR")
            return False

    def extract_description_from_source(self, html_source):
        """Fallback robusto extraindo a descrição do código-fonte HTML caso o Selenium falhe."""
        import re
        from html import unescape
        
        idx = html_source.find('data-testid="expandable-text-box"')
        if idx == -1:
            idx = html_source.find('class="jobs-description__content')
        if idx == -1:
            idx = html_source.find('id="job-details"')
            
        if idx != -1:
            chunk = html_source[idx:idx+100000]
            # Trunca o chunk antes de seções ou widgets seguintes comuns do LinkedIn
            for separator in [
                '<div class="jobs-box__share-job"', 
                'class="jobs-company-page-card"', 
                'class="jobs-box__sub-title"', 
                'class="jobs-description-details__list"', 
                'class="jobs-premium-applicant-insights'
            ]:
                sep_idx = chunk.find(separator)
                if sep_idx != -1:
                    chunk = chunk[:sep_idx]
            
            # Remove a tag HTML de abertura
            first_gt = chunk.find('>')
            if first_gt != -1:
                content = chunk[first_gt+1:]
                # Remove tags HTML e decodifica entidades
                clean_text = re.sub(r'<[^>]+>', '\n', content)
                clean_text = unescape(clean_text)
                # Normaliza múltiplos espaços e quebras de linha
                clean_text = re.sub(r'\n+', '\n', clean_text)
                clean_text = re.sub(r'[ \t]+', ' ', clean_text).strip()
                return clean_text
        return ""

    def check_and_handle_security_check(self):
        """Verifica se caímos em uma verificação de segurança e aguarda o usuário resolver."""
        try:
            current_url = self.driver.current_url
            page_title = self.driver.title.lower()
            
            if (
                "checkpoint" in current_url 
                or "challenge" in current_url 
                or "captcha" in page_title 
                or "humano" in page_title 
                or "security check" in page_title
                or "verificação" in page_title
            ):
                self._log("Desafio de segurança (CAPTCHA) ou verificação humana detectado!", "WARNING")
                self._log("Por favor, vá até a janela do Chrome aberta e resolva o desafio manualmente.", "WARNING")
                self._log("O script irá aguardar até 120 segundos para que você resolva...", "WARNING")
                
                for i in range(24):
                    time.sleep(5)
                    url_clean = self.driver.current_url
                    title_clean = self.driver.title.lower()
                    if not (
                        "checkpoint" in url_clean 
                        or "challenge" in url_clean 
                        or "captcha" in title_clean 
                        or "humano" in title_clean 
                        or "security check" in title_clean
                    ):
                        self._log("Desafio resolvido! Continuando a execução...")
                        self.random_sleep(2, 3)
                        return True
                self._log("Tempo limite esgotado. A vaga atual pode não ser detalhada corretamente.", "ERROR")
                return False
        except Exception as e:
            pass
        return True

    def scroll_sidebar(self):
        """Encontra e rola o container da barra lateral de listagem de vagas para carregar mais cartões."""
        try:
            sidebar = None
            for sel in self.SIDEBAR_SELECTORS:
                try:
                    sidebar = self.driver.find_element(By.CSS_SELECTOR, sel)
                    if sidebar:
                        break
                except:
                    continue
            
            if sidebar:
                self._log("Rolando a barra lateral para carregar cartões...")
                for i in range(8):
                    self.driver.execute_script(
                        "arguments[0].scrollTop = (arguments[0].scrollHeight / 8) * arguments[1];", 
                        sidebar, 
                        i + 1
                    )
                    self.random_sleep(0.3, 0.5)
            else:
                self.driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
                self.random_sleep(1.0, 1.5)
        except Exception as e:
            self._log(f"Erro ao rolar barra lateral: {e}", "WARNING")

    def go_to_page(self, page_num):
        """Clica no botão de paginação correspondente ao número fornecido."""
        try:
            # Rola a barra lateral e a janela principal para encontrar a paginação no rodapé
            self.driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
            self.random_sleep(1.0, 1.5)
            
            btn_xpath = (
                f"//button[contains(@aria-label, 'Page {page_num}')] | "
                f"//li[contains(@data-test-pagination-page-btn, '{page_num}')]//button | "
                f"//button[text()='{page_num}']"
            )
            btn = self.driver.find_element(By.XPATH, btn_xpath)
            if btn:
                self._log(f"Indo para a página {page_num}...")
                self.driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", btn)
                self.random_sleep(0.5, 1.0)
                self.driver.execute_script("arguments[0].click();", btn)
                self.random_sleep(4.0, 6.0)
                return True
        except Exception as e:
            self._log(f"Erro ao tentar ir para a página {page_num}: {e}", "WARNING")
        return False

    def _extract_title_and_company(self, query):
        """Extrai o título da vaga e nome da empresa usando o título da página ou seletores CSS."""
        titulo = f"{query} Developer"
        empresa = "Não Informada"
        
        page_title = self.driver.title
        if " | " in page_title:
            parts = page_title.split(" | ")
            if len(parts) >= 2:
                titulo = parts[0].strip().rstrip(".")
                empresa = parts[1].strip()
        else:
            try:
                titulo = self.driver.find_element(By.CSS_SELECTOR, "h1, h2, [class*='title']").text.strip()
            except:
                pass
            try:
                empresa = self.driver.find_element(By.CSS_SELECTOR, "[class*='company-name']").text.strip()
            except:
                pass
                
        return titulo, empresa

    def _expand_description_button(self):
        """Tenta localizar e clicar no botão de expandir a descrição para revelá-la por completo."""
        try:
            expand_btn = self.driver.find_element(By.XPATH, self.EXPAND_BUTTON_XPATH)
            if expand_btn.is_displayed():
                self.driver.execute_script("arguments[0].click();", expand_btn)
                self.random_sleep(1.0, 1.5)
        except:
            pass

    def _extract_job_description(self):
        """Busca a descrição nos seletores definidos, expandindo-a se necessário."""
        for sel in self.DESCRIPTION_SELECTORS:
            try:
                desc_elem = self.driver.find_element(By.CSS_SELECTOR, sel)
                if desc_elem.is_displayed():
                    self._expand_description_button()
                    descricao = desc_elem.text.strip()
                    if len(descricao) >= 150:
                        return descricao
            except:
                continue
        return ""

    def _extract_job_description_with_wait(self, timeout=12):
        """Espera a descrição carregar e a extrai, servindo como fallback."""
        try:
            wait = WebDriverWait(self.driver, timeout)
            combined_sel = ", ".join(self.DESCRIPTION_SELECTORS)
            desc_elem = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, combined_sel)))
            try:
                self.driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", desc_elem)
                self.random_sleep(1.0, 1.5)
            except:
                pass
            
            self._expand_description_button()
            return desc_elem.text.strip()
        except Exception as e:
            self._log(f"Timeout ao aguardar carregamento da descrição: {e}", "WARNING")
            return ""

    def _parse_job_metadata(self, title, page_text):
        """Analisa o título e o texto completo da página para inferir metadados da vaga."""
        modalidade = "HIBRIDO"
        if any(term in page_text for term in ["híbrido", "hibrido", "hybrid"]):
            modalidade = "HIBRIDO"
        elif any(term in page_text for term in ["presencial", "on-site", "local"]):
            modalidade = "PRESENCIAL"
        elif any(term in page_text for term in ["remoto", "remote", "home office"]):
            modalidade = "REMOTO"

        tipo_contrato = "CLT"
        if any(term in page_text for term in ["pj", "pessoa jurídica", "contrato"]):
            tipo_contrato = "PJ"

        nivel = "Pleno"
        tit_lower = title.lower()
        if any(term in tit_lower for term in ["sênior", "senior", "sr", "lead"]):
            nivel = "Senior"
        elif any(term in tit_lower for term in ["júnior", "junior", "jr", "estágio"]):
            nivel = "Junior"

        return modalidade, tipo_contrato, nivel

    def _extract_meta_from_card(self, card, job_id, query):
        """Extrai título, empresa, localização, modalidade e tipo de contrato do cartão na barra lateral."""
        titulo = f"{query} Developer"
        empresa = "Empresa Confidencial"
        localizacao = "Brasil"
        modalidade = "HIBRIDO"
        tipo_contrato = "CLT"
        
        try:
            # 1. Título: texto do link que contém o ID da vaga
            try:
                title_el = card.find_element(By.CSS_SELECTOR, f"a[href*='{job_id}']")
                titulo = title_el.text.strip()
            except:
                try:
                    title_el = card.find_element(By.CSS_SELECTOR, "a[href*='/jobs/view/']")
                    titulo = title_el.text.strip()
                except:
                    pass
            
            # 2. Empresa: link da página da empresa ou atributo aria-label
            try:
                try:
                    comp_el = card.find_element(By.CSS_SELECTOR, "a[href*='/company/']")
                    empresa = comp_el.text.strip()
                except:
                    comp_el = card.find_element(By.CSS_SELECTOR, "[aria-label*='Empresa']")
                    aria_label = comp_el.get_attribute("aria-label")
                    empresa = aria_label.replace("Empresa ", "").replace(".", "").strip()
            except:
                pass
                
            # 3. Localização e Metadados adicionais a partir das linhas de texto do card
            card_text = card.text
            lines = [l.strip() for l in card_text.split('\n') if l.strip()]
            
            for line in lines:
                if '·' in line:
                    parts = line.split('·')
                    if parts:
                        localizacao = parts[0].strip()
                        break
                        
            # Normalização de modalidade
            card_text_lower = card_text.lower()
            if "híbrido" in card_text_lower or "hibrido" in card_text_lower or "hybrid" in card_text_lower:
                modalidade = "HIBRIDO"
            elif "presencial" in card_text_lower or "on-site" in card_text_lower or "local" in card_text_lower:
                modalidade = "PRESENCIAL"
            elif "remoto" in card_text_lower or "remote" in card_text_lower or "home office" in card_text_lower:
                modalidade = "REMOTO"
                
            # Normalização de contrato
            if "pj" in card_text_lower or "pessoa jurídica" in card_text_lower:
                tipo_contrato = "PJ"
                
        except Exception as e:
            self._log(f"Erro ao extrair metadados do cartão: {e}", "WARNING")
            
        return titulo, empresa, localizacao, modalidade, tipo_contrato

    def extract_job_details_from_right_pane(self, job_id, job_url, query, titulo_card=None, empresa_card=None, localizacao_card=None, modalidade_card=None, contrato_card=None):
        """Extrai os detalhes da vaga diretamente do painel direito (AJAX)."""
        try:
            self.check_and_handle_security_check()
            
            # Sincroniza e garante que a URL do navegador atualizou para conter o currentJobId
            pane_updated = False
            start_wait = time.time()
            while time.time() - start_wait < 5.0:
                if f"currentJobId={job_id}" in self.driver.current_url:
                    pane_updated = True
                    break
                time.sleep(0.5)
                
            if not pane_updated:
                self._log(f"URL do navegador não atualizou para a vaga {job_id}. Tentando fallback por URL direta.", "WARNING")
                return self.extract_job_via_direct_url(job_id, job_url, query, titulo_card, empresa_card, localizacao_card, modalidade_card, contrato_card)
            
            # Aguarda o AJAX renderizar o painel direito
            self.random_sleep(1.5, 2.5)
            
            titulo, empresa = self._extract_title_and_company(query)
            
            # Dá preferência às informações extraídas do cartão se as extraídas da página forem genéricas
            if titulo_card and (not titulo or "Vagas de" in titulo or titulo == query + " Developer"):
                titulo = titulo_card
            if empresa_card and (not empresa or empresa == "LinkedIn" or empresa == "Não Informada"):
                empresa = empresa_card
                
            descricao = self._extract_job_description()
                    
            if not descricao or len(descricao) < 150:
                self._log(f"Descrição no painel direito ausente ou curta. Usando fallback por URL direta.", "WARNING")
                return self.extract_job_via_direct_url(job_id, job_url, query, titulo_card, empresa_card, localizacao_card, modalidade_card, contrato_card)
                
            localizacao = localizacao_card or "Brasil"
            page_text = self.driver.find_element(By.TAG_NAME, "body").text.lower()
            modalidade, tipo_contrato, nivel = self._parse_job_metadata(titulo, page_text)
            
            if modalidade_card:
                modalidade = modalidade_card
            if contrato_card:
                tipo_contrato = contrato_card
            
            self._log(f"Dados extraídos com sucesso da vaga {job_id} (Painel Direito).")
            
            return {
                "titulo": titulo,
                "empresa": empresa,
                "descricao": descricao,
                "localizacao": localizacao,
                "modalidade": modalidade,
                "tipo_contrato": tipo_contrato,
                "nivel": nivel,
                "salario_min": None,
                "salario_max": None,
                "origem": "LinkedIn",
                "link": job_url
            }
        except Exception as e:
            self._log(f"Erro ao extrair dados do painel direito: {e}. Tentando fallback por URL direta.", "WARNING")
            return self.extract_job_via_direct_url(job_id, job_url, query, titulo_card, empresa_card, localizacao_card, modalidade_card, contrato_card)

    def extract_job_via_direct_url(self, job_id, job_url, query, titulo_card=None, empresa_card=None, localizacao_card=None, modalidade_card=None, contrato_card=None):
        """Extrai os detalhes da vaga abrindo a URL direta em nova navegação (Fallback)."""
        original_url = self.driver.current_url
        try:
            self.driver.get(job_url)
            self.random_sleep(3, 5)
            self.check_and_handle_security_check()
            
            titulo, empresa = self._extract_title_and_company(query)
            
            # Dá preferência às informações extraídas do cartão se as extraídas da página forem genéricas
            if titulo_card and (not titulo or "Vagas de" in titulo or titulo == query + " Developer"):
                titulo = titulo_card
            if empresa_card and (not empresa or empresa == "LinkedIn" or empresa == "Não Informada"):
                empresa = empresa_card
                
            descricao = self._extract_job_description_with_wait()
                    
            if not descricao or len(descricao) < 150:
                try:
                    source_desc = self.extract_description_from_source(self.driver.page_source)
                    if source_desc and len(source_desc) >= 150:
                        descricao = source_desc
                except Exception as e:
                    self._log(f"Erro ao extrair descrição do código-fonte: {e}", "WARNING")
                    
            if not descricao or len(descricao) < 150:
                descricao = "Sem descrição detalhada disponível."
                
            localizacao = localizacao_card or "Brasil"
            page_text = self.driver.find_element(By.TAG_NAME, "body").text.lower()
            modalidade, tipo_contrato, nivel = self._parse_job_metadata(titulo, page_text)
            
            if modalidade_card:
                modalidade = modalidade_card
            if contrato_card:
                tipo_contrato = contrato_card
                
            self._log(f"Dados extraídos com sucesso da vaga {job_id} (Fallback URL direta).")
            
            return {
                "titulo": titulo,
                "empresa": empresa,
                "descricao": descricao,
                "localizacao": localizacao,
                "modalidade": modalidade,
                "tipo_contrato": tipo_contrato,
                "nivel": nivel,
                "salario_min": None,
                "salario_max": None,
                "origem": "LinkedIn",
                "link": job_url
            }
        except Exception as e:
            self._log(f"Erro no fallback por URL direta para {job_id}: {e}", "ERROR")
            return None
        finally:
            try:
                self.driver.get(original_url)
                self.random_sleep(3, 5)
            except Exception as e:
                self._log(f"Erro ao retornar para a URL original: {e}", "WARNING")

    def _wait_for_job_listings(self):
        """Aguarda até que a listagem de vagas seja carregada na página."""
        try:
            wait = WebDriverWait(self.driver, 12)
            wait.until(EC.presence_of_element_located(
                (By.CSS_SELECTOR, "ul.scaffold-layout__list-container, [data-job-id], [class*='results-list']")
            ))
        except Exception as e:
            self._log(f"Listagem de vagas demorou para carregar: {e}", "WARNING")

    def _find_job_cards(self):
        """Encontra todos os cartões de vagas na página atual com base nos seletores conhecidos."""
        for sel in self.CARD_SELECTORS:
            cards = self.driver.find_elements(By.CSS_SELECTOR, sel)
            if cards:
                return cards
        return []

    def _extract_job_id_from_card(self, card):
        """Tenta extrair o ID único da vaga de um cartão na barra lateral."""
        try:
            job_id = card.get_attribute("data-occludable-job-id") or card.get_attribute("data-job-id")
            if job_id:
                return job_id
            
            # Fallback buscando link direto
            link = card.find_element(By.CSS_SELECTOR, "a[href*='/jobs/view/']")
            href = link.get_attribute("href")
            return href.split("/jobs/view/")[1].split("/")[0]
        except:
            return None

    def _click_and_sync_card(self, card, job_id, index, num_cards):
        """Faz a rolagem, clica no link do título do cartão da vaga contendo o job_id e aguarda a URL atualizar."""
        try:
            click_target = None
            try:
                # Localiza a tag 'a' que contém o ID específico da vaga no atributo href
                click_target = card.find_element(By.CSS_SELECTOR, f"a[href*='{job_id}']")
            except:
                pass
                
            if not click_target:
                try:
                    click_target = card.find_element(By.CSS_SELECTOR, "a.job-card-list__title, a.job-card-container__link, a[href*='/jobs/view/']")
                except:
                    pass
            
            if not click_target:
                click_target = card
                
            self.driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", click_target)
            self.random_sleep(0.5, 1.0)
            
            self._log(f"Clicando na vaga {index + 1}/{num_cards} (ID: {job_id}) na barra lateral...")
            
            try:
                # Tenta o clique nativo para disparar corretamente o React e atualizar a URL via AJAX
                click_target.click()
            except Exception as e:
                # Fallback para JavaScript caso o clique nativo seja interceptado
                self.driver.execute_script("arguments[0].click();", click_target)
            
            # Aguarda a URL do navegador atualizar para constar o ID da vaga atual
            pane_updated = False
            start_wait = time.time()
            while time.time() - start_wait < 5.0:
                if f"currentJobId={job_id}" in self.driver.current_url:
                    pane_updated = True
                    break
                time.sleep(0.5)
                
            if not pane_updated:
                self._log("URL não atualizou via AJAX. Tentando clique alternativo via JavaScript...", "WARNING")
                try:
                    self.driver.execute_script("arguments[0].click();", click_target)
                except Exception as js_err:
                    self._log(f"Erro no clique via JS: {js_err}", "WARNING")
            
            return True
        except Exception as click_err:
            self._log(f"Erro ao clicar no cartão {job_id}: {click_err}", "ERROR")
            return False

    def scrape(self, query, limit=10):
        """Busca vagas no LinkedIn utilizando a conta logada com Single-Page List-Iteration."""
        self.init_driver()
        vagas = []
        
        # Realiza o login (ou reusa a sessão ativa)
        if not self.login():
            self._log("Não foi possível efetuar o login. Abortando.", "ERROR")
            self.close()
            return []
            
        encoded_query = urllib.parse.quote(query)
        url = f"https://www.linkedin.com/jobs/search/?keywords={encoded_query}&location=Brasil"
        self._log(f"Acessando busca de vagas: {url}")
        
        try:
            self.driver.get(url)
            self.random_sleep(4, 6)
            
            current_page = 1
            processed_ids = set()
            
            while len(vagas) < limit:
                self._log(f"Processando listagem da página {current_page}...")
                
                self._wait_for_job_listings()
                self.scroll_sidebar()
                
                cards = self._find_job_cards()
                num_cards = len(cards)
                self._log(f"Encontrados {num_cards} cartões de vagas na página {current_page}.")
                
                if num_cards == 0:
                    self._log("Nenhum cartão de vaga encontrado na página atual. Encerrando.", "WARNING")
                    break
 
                for index in range(num_cards):
                    if len(vagas) >= limit:
                        break
                        
                    # Re-localiza os cartões a cada iteração para evitar StaleElementReferenceException
                    try:
                        cards = self._find_job_cards()
                        if index >= len(cards):
                            break
                        card = cards[index]
                    except Exception as loc_err:
                        self._log(f"Erro ao re-localizar cartão {index}: {loc_err}", "WARNING")
                        continue
                        
                    job_id = self._extract_job_id_from_card(card)
                    if not job_id or job_id in processed_ids:
                        continue
                        
                    processed_ids.add(job_id)
                    job_url = f"https://www.linkedin.com/jobs/view/{job_id}/"
                    
                    # Extrai os metadados do cartão antes de clicar (para evitar elementos stale ou DOM atualizado)
                    t_card, e_card, l_card, m_card, c_card = self._extract_meta_from_card(card, job_id, query)
                    
                    if self._click_and_sync_card(card, job_id, index, num_cards):
                        vaga_info = self.extract_job_details_from_right_pane(
                            job_id, job_url, query,
                            titulo_card=t_card, empresa_card=e_card,
                            localizacao_card=l_card, modalidade_card=m_card,
                            contrato_card=c_card
                        )
                        if vaga_info:
                            vagas.append(vaga_info)
                        
                if len(vagas) >= limit:
                    break
                    
                # Avança de página
                current_page += 1
                if not self.go_to_page(current_page):
                    self._log("Não foi possível avançar de página. Encerrando scraping.", "WARNING")
                    break
                    
        except Exception as e:
            self._log(f"Erro geral durante scraping: {e}", "ERROR")
        finally:
            self.close()
            
        return vagas
