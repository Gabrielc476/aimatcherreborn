import re


class ValidacaoServico:
    """
    Serviço responsável pela validação de dados de usuário.
    """

    @staticmethod
    def validar_dados_cadastro(dados):
        """
        Valida os dados de cadastro de um usuário.

        Args:
            dados (dict): Dicionário com os dados do usuário

        Returns:
            tuple: (valido, mensagem)
                - valido (bool): True se os dados são válidos, False caso contrário
                - mensagem (str): Mensagem de erro ou None se válido
        """
        # Verifica se os campos obrigatórios foram fornecidos
        if not dados.get('email'):
            return False, "Email é obrigatório"

        if not dados.get('senha'):
            return False, "Senha é obrigatória"

        if not dados.get('nome_completo'):
            return False, "Nome completo é obrigatório"

        # Valida o formato do email
        email = dados.get('email', '')
        padrao_email = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(padrao_email, email):
            return False, "Formato de email inválido"

        # Valida a força da senha
        senha = dados.get('senha', '')
        if len(senha) < 8:
            return False, "A senha deve ter pelo menos 8 caracteres"

        # Todas as validações passaram
        return True, None

    @staticmethod
    def validar_dados_login(dados):
        """
        Valida os dados de login de um usuário.

        Args:
            dados (dict): Dicionário com os dados de login

        Returns:
            tuple: (valido, mensagem)
                - valido (bool): True se os dados são válidos, False caso contrário
                - mensagem (str): Mensagem de erro ou None se válido
        """
        # Verifica se os campos obrigatórios foram fornecidos
        if not dados.get('email'):
            return False, "Email é obrigatório"

        if not dados.get('senha'):
            return False, "Senha é obrigatória"

        # Todas as validações passaram
        return True, None