"""
Field Encryption Module

Provides encryption/decryption for sensitive fiscal data (API keys, credentials).
Uses Fernet (symmetric encryption) from cryptography library.

Usage:
    from app.core.encryption import field_encryption

    encrypted = field_encryption.encrypt("sensitive_data")
    decrypted = field_encryption.decrypt(encrypted)
"""

from cryptography.fernet import Fernet
from app.core.config import settings
import base64


class FieldEncryption:
    """
    Handles field-level encryption for sensitive data.

    Uses Fernet symmetric encryption (AES 128 in CBC mode).
    """

    def __init__(self, key: bytes = None):
        """
        Initialize encryption with a key.

        Args:
            key: Encryption key (32 url-safe base64-encoded bytes)
                 If None, uses ENCRYPTION_KEY from settings
        """
        if key is None:
            # Get key from environment variable
            key_str = settings.ENCRYPTION_KEY

            # Ensure key is in correct format
            if isinstance(key_str, str):
                key = key_str.encode()
            else:
                key = key_str

        # Validate key format
        try:
            self.cipher = Fernet(key)
        except Exception as e:
            raise ValueError(f"Invalid encryption key format: {str(e)}")

    def encrypt(self, value: str) -> str:
        """
        Encrypt a string value.

        Args:
            value: Plain text string to encrypt

        Returns:
            Encrypted string (base64 encoded)
        """
        if not value:
            return value

        try:
            encrypted_bytes = self.cipher.encrypt(value.encode('utf-8'))
            return encrypted_bytes.decode('utf-8')
        except Exception as e:
            raise ValueError(f"Encryption failed: {str(e)}")

    def decrypt(self, encrypted_value: str) -> str:
        """
        Decrypt an encrypted string.

        Args:
            encrypted_value: Encrypted string (base64 encoded)

        Returns:
            Decrypted plain text string
        """
        if not encrypted_value:
            return encrypted_value

        try:
            decrypted_bytes = self.cipher.decrypt(encrypted_value.encode('utf-8'))
            return decrypted_bytes.decode('utf-8')
        except Exception as e:
            raise ValueError(f"Decryption failed: {str(e)}")


# Global instance - use this throughout the application
field_encryption = FieldEncryption()


def generate_encryption_key() -> str:
    """
    Generate a new encryption key.

    Use this once to generate a key, then store it in .env as ENCRYPTION_KEY.

    Returns:
        Base64-encoded encryption key (string)
    """
    key = Fernet.generate_key()
    return key.decode('utf-8')


if __name__ == "__main__":
    # Generate a new key (run this once and add to .env)
    print("=== Encryption Key Generator ===")
    print("\nGenerated encryption key (add to .env as ENCRYPTION_KEY):")
    print(generate_encryption_key())
    print("\nExample usage:")
    print("  ENCRYPTION_KEY=<generated_key_above>")
