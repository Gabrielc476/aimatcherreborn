import argparse
import json
import csv
import sys
from pathlib import Path

from config import validate_config, DATABASE_URL
from database import save_jobs_to_db

# Importa as engines de scraping
from engines.linkedin import LinkedInEngine
from engines.nerdin import NerdinEngine
from engines.indeed import IndeedEngine
from engines.infojobs import InfoJobsEngine
from engines.weworkremotely import WeWorkRemotelyEngine

# Mapeamento de nome -> classe da engine
ENGINES = {
    "linkedin": LinkedInEngine,
    "nerdin": NerdinEngine,
    "indeed": IndeedEngine,
    "infojobs": InfoJobsEngine,
    "weworkremotely": WeWorkRemotelyEngine
}

def parse_args():
    parser = argparse.ArgumentParser(description="Orquestrador do Serviço de Garimpo de Vagas (Scraper)")
    
    parser.add_argument(
        "--engine", 
        type=str, 
        default="all",
        help="Engines a serem executadas separadas por vírgula (ex: linkedin,nerdin) ou 'all' para rodar todas."
    )
    
    parser.add_argument(
        "--query", 
        type=str, 
        default="Python",
        help="Termo de pesquisa/tecnologia para buscar (ex: 'React', 'Python', 'Node.js')."
    )
    
    parser.add_argument(
        "--limit", 
        type=int, 
        default=5,
        help="Limite de vagas a serem raspadas por plataforma (padrão: 5)."
    )
    
    parser.add_argument(
        "--save-file", 
        type=str, 
        default="",
        help="Caminho do arquivo (JSON ou CSV) para salvar os resultados localmente (ex: vagas.json)."
    )
    
    parser.add_argument(
        "--no-db", 
        action="store_true",
        help="Se informado, pula a gravação dos resultados no banco de dados Supabase."
    )
    
    return parser.parse_args()

def save_to_local_file(filepath, data):
    """Salva a lista de vagas raspadas em um arquivo local (JSON ou CSV)."""
    if not filepath:
        return
        
    path = Path(filepath)
    print(f"[SCRAPER] Salvando resultados localmente em: {path.resolve()}")
    
    try:
        if path.suffix.lower() == ".json":
            with open(path, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=4)
            print(f"[SCRAPER] Arquivo JSON gravado com sucesso.")
        elif path.suffix.lower() == ".csv":
            if not data:
                print("[SCRAPER] Nenhum dado para salvar no CSV.")
                return
            keys = data[0].keys()
            with open(path, "w", encoding="utf-8", newline="") as f:
                writer = csv.DictWriter(f, fieldnames=keys)
                writer.writeheader()
                writer.writerows(data)
            print(f"[SCRAPER] Arquivo CSV gravado com sucesso.")
        else:
            print(f"[SCRAPER] Formato de arquivo '{path.suffix}' não suportado. Use .json ou .csv.")
    except Exception as e:
        print(f"[SCRAPER ERROR] Erro ao salvar arquivo local: {e}")

def main():
    args = parse_args()
    
    # Valida configurações básicas e credenciais
    validate_config()
    
    # Determina quais engines executar
    selected_engine_names = []
    if args.engine.lower() == "all":
        selected_engine_names = list(ENGINES.keys())
    else:
        for name in args.engine.split(","):
            name = name.strip().lower()
            if name in ENGINES:
                selected_engine_names.append(name)
            else:
                print(f"[WARNING] Engine '{name}' não reconhecida. Opções válidas: {list(ENGINES.keys())}")
                
    if not selected_engine_names:
        print("[ERROR] Nenhuma engine válida selecionada para execução. Abortando.")
        sys.exit(1)
        
    print(f"\n[SCRAPER] Iniciando garimpo...")
    print(f"[SCRAPER] Termo de busca: '{args.query}'")
    print(f"[SCRAPER] Limite por plataforma: {args.limit}")
    print(f"[SCRAPER] Engines ativas: {', '.join(selected_engine_names)}\n")
    
    all_vagas = []
    
    for engine_name in selected_engine_names:
        print(f"--- Executando engine: {engine_name.upper()} ---")
        try:
            # Instancia a classe correspondente
            engine_class = ENGINES[engine_name]
            engine_instance = engine_class()
            
            # Executa a raspagem
            vagas_raspadas = engine_instance.scrape(args.query, limit=args.limit)
            print(f"[{engine_name.upper()}] Raspou {len(vagas_raspadas)} vagas com sucesso.")
            all_vagas.extend(vagas_raspadas)
            
        except Exception as e:
            print(f"[ERROR] Falha crítica na execução da engine {engine_name.upper()}: {e}")
            continue
            
    print(f"\n==================================================")
    print(f"[SCRAPER] Resumo do Processo:")
    print(f"[SCRAPER] Total de vagas coletadas: {len(all_vagas)}")
    print(f"==================================================\n")
    
    # Salva arquivo local se solicitado
    if args.save_file:
        save_to_local_file(args.save_file, all_vagas)
        
    # Salva no banco de dados se aplicável
    if not args.no_db and DATABASE_URL:
        print("[SCRAPER] Gravando novas vagas no banco PostgreSQL...")
        save_jobs_to_db(all_vagas)
    else:
        print("[SCRAPER] Gravação no banco de dados pulada (ou DATABASE_URL ausente).")

if __name__ == "__main__":
    main()
