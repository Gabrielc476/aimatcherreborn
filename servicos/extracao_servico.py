# servicos/extracao_servico.py
import os
import tempfile
from PyPDF2 import PdfReader


class ExtracaoServico:
    """
    Serviço responsável pela extração de texto de arquivos PDF.
    """

    @staticmethod
    def extrair_texto_pdf(arquivo_pdf):
        """
        Extrai o texto completo de um arquivo PDF.

        Args:
            arquivo_pdf: Arquivo PDF em formato de bytes ou caminho para o arquivo

        Returns:
            tuple: (sucesso, texto, erro)
                - sucesso (bool): True se a extração foi bem-sucedida, False caso contrário
                - texto (str): Texto extraído ou None se falhou
                - erro (str): Mensagem de erro ou None se sucesso
        """
        temp_path = None
        try:
            # Se for bytes, salva em arquivo temporário
            if isinstance(arquivo_pdf, bytes):
                with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as temp_file:
                    temp_path = temp_file.name
                    temp_file.write(arquivo_pdf)
                pdf_path = temp_path
            else:
                # Se for caminho para arquivo
                pdf_path = arquivo_pdf

            # Abre o PDF
            reader = PdfReader(pdf_path)

            # Extrai o texto de todas as páginas
            texto_completo = ""
            for pagina in reader.pages:
                texto_completo += pagina.extract_text() + "\n\n"

            # Limpa o arquivo temporário se foi criado
            if temp_path:
                os.unlink(temp_path)

            # Verifica se obteve algum texto
            if not texto_completo.strip():
                return False, None, "Não foi possível extrair texto do PDF. O arquivo pode estar protegido ou ser uma imagem."

            return True, texto_completo, None

        except Exception as e:
            # Limpa o arquivo temporário em caso de erro
            if temp_path and os.path.exists(temp_path):
                try:
                    os.unlink(temp_path)
                except:
                    pass
            return False, None, f"Erro ao extrair texto do PDF: {str(e)}"