import jwt
from datetime import datetime, timedelta
import os


class TokenServico:
    """
    Serviço responsável pela geração e validação de tokens JWT.
    """

    def __init__(self,  algoritmo='HS256'):
        """
        Inicializa o serviço de token.

        Args:
            segredo (str): Chave secreta para assinar os tokens
            algoritmo (str): Algoritmo de assinatura
        """
        # Usa a chave secreta passada ou gera uma nova a partir do ambiente
        self.segredo = os.getenv('JWT_SECRET')
        self.algoritmo = algoritmo

    def gerar_token(self, usuario_id, tempo_expiracao=24):
        """
        Gera um token JWT para um usuário.

        Args:
            usuario_id (str): ID do usuário
            tempo_expiracao (int): Tempo de expiração em horas

        Returns:
            str: Token JWT gerado
        """
        # Define quando o token foi emitido
        agora = datetime.utcnow()

        # Define quando o token vai expirar
        expiracao = agora + timedelta(hours=tempo_expiracao)

        # Payload do token
        payload = {
            'sub': usuario_id,  # subject (assunto) - ID do usuário
            'iat': agora,  # issued at (emitido em)
            'exp': expiracao  # expiration time (tempo de expiração)
        }

        # Gera o token
        token = jwt.encode(payload, self.segredo, algorithm=self.algoritmo)

        return token

    def validar_token(self, token):
        """
        Valida um token JWT.

        Args:
            token (str): Token JWT

        Returns:
            tuple: (valido, usuario_id, mensagem)
                - valido (bool): True se válido, False caso contrário
                - usuario_id (str): ID do usuário ou None se inválido
                - mensagem (str): Mensagem de erro ou None se válido
        """
        try:
            # Decodifica o token
            payload = jwt.decode(token, self.segredo, algorithms=[self.algoritmo])

            # Extrai o ID do usuário
            usuario_id = payload['sub']

            return True, usuario_id, None

        except jwt.ExpiredSignatureError:
            return False, None, "Token expirado"

        except jwt.InvalidTokenError:
            return False, None, "Token inválido"

    def obter_novo_token(self, token_atual):
        """
        Gera um novo token a partir de um token válido existente.
        Útil para implementar refresh token.

        Args:
            token_atual (str): Token JWT atual

        Returns:
            tuple: (sucesso, novo_token, mensagem)
                - sucesso (bool): True se gerado, False caso contrário
                - novo_token (str): Novo token ou None se falhou
                - mensagem (str): Mensagem de erro ou None se sucesso
        """
        # Valida o token atual
        valido, usuario_id, mensagem = self.validar_token(token_atual)

        if not valido:
            return False, None, mensagem

        # Gera um novo token
        novo_token = self.gerar_token(usuario_id)

        return True, novo_token, None