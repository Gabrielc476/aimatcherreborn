import psycopg2
from psycopg2.extras import RealDictCursor
import uuid
from datetime import datetime
from config import DATABASE_URL

def get_connection():
    """Retorna uma conexão ativa com o banco PostgreSQL."""
    if not DATABASE_URL:
        return None
    try:
        conn = psycopg2.connect(DATABASE_URL)
        return conn
    except Exception as e:
        print(f"[DATABASE ERROR] Não foi possível conectar ao banco: {e}")
        return None

def get_or_create_scraper_user(conn):
    """Garante a existência de um usuário 'Scraper' para associar as vagas."""
    email = "scraper@aimatcher.com"
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        # Verifica se o usuário já existe
        cur.execute("SELECT id FROM usuarios WHERE email = %s;", (email,))
        row = cur.fetchone()
        if row:
            return row['id']
        
        # Caso não exista, cria o usuário
        user_id = str(uuid.uuid4())
        # Dummy bcrypt hash para 'scraper'
        senha_hash = "$2b$10$7zB3L2fX9P1qI5RzBv2.Pe8s/d6l.vRkK2C.fN3JgS6qD2rI1uH2m" 
        cur.execute(
            """
            INSERT INTO usuarios (id, nome_completo, email, senha_hash, status, data_criacao)
            VALUES (%s, %s, %s, %s, 'ATIVO', NOW())
            RETURNING id;
            """,
            (user_id, "Robô Scraper", email, senha_hash)
        )
        # Nota: Caso a coluna no banco seja 'data_criacao' ou 'data_creacao' (Prisma mapeia @map("data_criacao")),
        # colocamos data_criacao para alinhar com o schema.
        
        # Vamos tratar possíveis erros de coluna não existente capturando exceções
        conn.commit()
        print(f"[DATABASE] Usuário virtual 'Scraper' criado com o ID: {user_id}")
        return user_id

def clean_modalidade(modalidade_str):
    """Mapeia a string de modalidade para o Enum aceito pelo banco."""
    m = str(modalidade_str).upper()
    if "REMOTO" in m or "REMOTE" in m or "HOME" in m:
        return "REMOTO"
    elif "HIBRIDO" in m or "HÍBRIDO" in m or "HYBRID" in m:
        return "HIBRIDO"
    else:
        return "PRESENCIAL"

def insert_vaga(conn, recrutador_id, vaga_data):
    """Insere uma vaga no banco de dados se ela ainda não existir."""
    titulo = vaga_data.get("titulo")
    empresa = vaga_data.get("empresa")
    descricao = vaga_data.get("descricao")
    localizacao = vaga_data.get("localizacao", "")
    modalidade = clean_modalidade(vaga_data.get("modalidade", "REMOTO"))
    tipo_contrato = vaga_data.get("tipo_contrato", "CLT")
    nivel = vaga_data.get("nivel", "Pleno")
    salario_min = vaga_data.get("salario_min")
    salario_max = vaga_data.get("salario_max")
    
    # Verifica se já existe uma vaga com mesmo título, empresa e modalidade inserida nas últimas 2 semanas
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT id FROM vagas 
            WHERE titulo = %s AND empresa_nome = %s AND recrutador_id = %s 
              AND data_criacao > NOW() - INTERVAL '14 days';
            """,
            (titulo, empresa, recrutador_id)
        )
        if cur.fetchone():
            return False  # Vaga duplicada, pula a inserção
        
        vaga_id = str(uuid.uuid4())
        
        cur.execute(
            """
            INSERT INTO vagas (
                id, recrutador_id, titulo, descricao, status, 
                empresa_nome, localizacao, modalidade, tipo_contrato, nivel,
                salario_min, salario_max, data_criacao
            ) VALUES (%s, %s, %s, %s, 'ativa', %s, %s, %s::"ModalidadeTrabalho", %s, %s, %s, %s, NOW());
            """,
            (
                vaga_id, recrutador_id, titulo, descricao,
                empresa, localizacao, modalidade, tipo_contrato, nivel,
                salario_min, salario_max
            )
        )
        return True

def save_jobs_to_api(vagas_list):
    """Envia as vagas encontradas para a API do NestJS para processamento de IA e persistência."""
    import requests
    from config import BACKEND_URL, SCRAPER_API_TOKEN
    
    if not BACKEND_URL or not SCRAPER_API_TOKEN:
        print("[DATABASE/API] BACKEND_URL ou SCRAPER_API_TOKEN não configurados. Pulando integração API.")
        return 0
        
    url = f"{BACKEND_URL.rstrip('/')}/vaga/integrar-externo"
    headers = {
        "x-scraper-token": SCRAPER_API_TOKEN,
        "Content-Type": "application/json"
    }
    
    inserted_count = 0
    for vaga in vagas_list:
        try:
            # Constrói o corpo da requisição
            payload = {
                "titulo": vaga.get("titulo"),
                "empresaNome": vaga.get("empresa"),
                "descricao": vaga.get("descricao"),
                "localizacao": vaga.get("localizacao", ""),
                "modalidade": vaga.get("modalidade", "REMOTO"),
                "tipoContrato": vaga.get("tipo_contrato", "CLT"),
                "nivel": vaga.get("nivel", "Pleno"),
                "salarioMin": vaga.get("salario_min"),
                "salarioMax": vaga.get("salario_max")
            }
            
            response = requests.post(url, json=payload, headers=headers, timeout=180)
            if response.status_code == 201:
                inserted_count += 1
                print(f"[API INTEGRATION] Vaga '{vaga.get('titulo')}' integrada com sucesso.")
                import time
                time.sleep(8.0)
            elif response.status_code == 200:
                print(f"[API INTEGRATION] Vaga '{vaga.get('titulo')}' já integrada anteriormente (pulada).")
            else:
                print(f"[API INTEGRATION] Erro ao integrar vaga '{vaga.get('titulo')}'. HTTP {response.status_code}: {response.text}")
        except Exception as e:
            print(f"[API INTEGRATION ERROR] Falha na chamada HTTP para '{vaga.get('titulo')}': {e}")
            
    print(f"[API INTEGRATION] Total integrado: {inserted_count}/{len(vagas_list)} vagas.")
    return inserted_count

def save_jobs_to_db(vagas_list):
    """Gerencia a conexão e insere uma lista de vagas no banco de dados (API ou DB direto)."""
    from config import INTEGRATION_MODE
    
    if INTEGRATION_MODE == "API":
        print("[DATABASE] Modo de integração via API detectado. Redirecionando...")
        return save_jobs_to_api(vagas_list)
        
    print("[DATABASE] Modo de integração direta com banco PostgreSQL detectado.")
    conn = get_connection()
    if not conn:
        print("[DATABASE] Não conectado. Pulando inserção no banco.")
        return 0
    
    inserted_count = 0
    try:
        # Primeiro garantimos que a coluna 'data_criacao' e o usuário existam
        recrutador_id = get_or_create_scraper_user(conn)
        
        for vaga in vagas_list:
            try:
                success = insert_vaga(conn, recrutador_id, vaga)
                if success:
                    inserted_count += 1
            except Exception as item_error:
                conn.rollback()
                print(f"[DATABASE ERROR] Erro ao inserir vaga '{vaga.get('titulo')}': {item_error}")
                continue
        
        conn.commit()
        print(f"[DATABASE] {inserted_count} novas vagas inseridas com sucesso.")
    except Exception as e:
        conn.rollback()
        print(f"[DATABASE ERROR] Erro geral ao salvar vagas: {e}")
    finally:
        conn.close()
        
    return inserted_count
