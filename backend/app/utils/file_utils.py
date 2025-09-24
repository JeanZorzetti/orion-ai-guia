import os
import mimetypes
from pathlib import Path
from typing import Optional
import PyPDF2
import hashlib

class FileUtils:
    """
    Utilitários para manipulação de arquivos
    """

    @staticmethod
    def get_file_size(file_path: str) -> int:
        """Retorna o tamanho do arquivo em bytes"""
        return os.path.getsize(file_path)

    @staticmethod
    def get_file_mime_type(file_path: str) -> Optional[str]:
        """Retorna o tipo MIME do arquivo"""
        return mimetypes.guess_type(file_path)[0]

    @staticmethod
    def get_file_extension(file_path: str) -> str:
        """Retorna a extensão do arquivo"""
        return Path(file_path).suffix.lower()

    @staticmethod
    def is_pdf(file_path: str) -> bool:
        """Verifica se o arquivo é PDF"""
        return FileUtils.get_file_extension(file_path) == '.pdf'

    @staticmethod
    def is_image(file_path: str) -> bool:
        """Verifica se o arquivo é uma imagem"""
        image_extensions = {'.jpg', '.jpeg', '.png', '.bmp', '.gif', '.tiff'}
        return FileUtils.get_file_extension(file_path) in image_extensions

    @staticmethod
    def extract_pdf_text(file_path: str) -> str:
        """
        Extrai texto de arquivo PDF

        Args:
            file_path: Caminho para o arquivo PDF

        Returns:
            Texto extraído do PDF
        """
        try:
            text = ""
            with open(file_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)

                # Itera por todas as páginas
                for page_num in range(len(pdf_reader.pages)):
                    page = pdf_reader.pages[page_num]
                    text += page.extract_text() + "\n"

            return text.strip()

        except Exception as e:
            print(f"Erro ao extrair texto do PDF {file_path}: {e}")
            return ""

    @staticmethod
    def get_file_hash(file_path: str) -> str:
        """
        Gera hash MD5 do arquivo para detecção de duplicatas

        Args:
            file_path: Caminho para o arquivo

        Returns:
            Hash MD5 do arquivo
        """
        try:
            hash_md5 = hashlib.md5()
            with open(file_path, "rb") as f:
                for chunk in iter(lambda: f.read(4096), b""):
                    hash_md5.update(chunk)
            return hash_md5.hexdigest()

        except Exception as e:
            print(f"Erro ao calcular hash do arquivo {file_path}: {e}")
            return ""

    @staticmethod
    def validate_file_type(file_path: str, allowed_extensions: set) -> bool:
        """
        Valida se o arquivo tem extensão permitida

        Args:
            file_path: Caminho para o arquivo
            allowed_extensions: Set com extensões permitidas (ex: {'.pdf', '.jpg'})

        Returns:
            True se o arquivo é válido
        """
        file_ext = FileUtils.get_file_extension(file_path)
        return file_ext in allowed_extensions

    @staticmethod
    def safe_filename(filename: str) -> str:
        """
        Sanitiza nome do arquivo removendo caracteres perigosos

        Args:
            filename: Nome original do arquivo

        Returns:
            Nome seguro para o arquivo
        """
        # Remove caracteres perigosos
        dangerous_chars = '<>:"/\\|?*'
        safe_name = filename

        for char in dangerous_chars:
            safe_name = safe_name.replace(char, '_')

        # Remove espaços extras e substitui por underline
        safe_name = '_'.join(safe_name.split())

        return safe_name

    @staticmethod
    def ensure_directory(directory_path: str) -> bool:
        """
        Garante que o diretório existe, criando se necessário

        Args:
            directory_path: Caminho para o diretório

        Returns:
            True se o diretório existe ou foi criado com sucesso
        """
        try:
            Path(directory_path).mkdir(parents=True, exist_ok=True)
            return True
        except Exception as e:
            print(f"Erro ao criar diretório {directory_path}: {e}")
            return False

    @staticmethod
    def get_file_info(file_path: str) -> dict:
        """
        Retorna informações completas sobre o arquivo

        Args:
            file_path: Caminho para o arquivo

        Returns:
            Dict com informações do arquivo
        """
        try:
            stat_info = os.stat(file_path)

            return {
                "filename": os.path.basename(file_path),
                "size": stat_info.st_size,
                "size_mb": round(stat_info.st_size / (1024 * 1024), 2),
                "extension": FileUtils.get_file_extension(file_path),
                "mime_type": FileUtils.get_file_mime_type(file_path),
                "created_at": stat_info.st_ctime,
                "modified_at": stat_info.st_mtime,
                "is_pdf": FileUtils.is_pdf(file_path),
                "is_image": FileUtils.is_image(file_path),
                "hash": FileUtils.get_file_hash(file_path)
            }

        except Exception as e:
            return {
                "error": f"Erro ao obter informações do arquivo: {e}"
            }