#!/bin/bash

#######################################################################
# Generador de Claves de Encriptación AES-256
#
# Genera claves criptográficamente seguras de 32 bytes (256 bits)
# usando OpenSSL CSPRNG.
#
# Uso:
#   chmod +x scripts/generate-encryption-key.sh
#   ./scripts/generate-encryption-key.sh
#
# O para generar múltiples claves:
#   ./scripts/generate-encryption-key.sh 5
#######################################################################

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Banner
echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║    Generador de Claves de Encriptación - Clinicboard      ║"
echo "║                   AES-256-GCM (32 bytes)                   ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Verificar que OpenSSL está instalado
if ! command -v openssl &> /dev/null; then
    echo -e "${RED}❌ Error: OpenSSL no está instalado${NC}"
    echo ""
    echo "Instalar OpenSSL:"
    echo "  macOS:   brew install openssl"
    echo "  Ubuntu:  sudo apt-get install openssl"
    echo "  Windows: https://slproweb.com/products/Win32OpenSSL.html"
    exit 1
fi

# Número de claves a generar (default: 1)
NUM_KEYS=${1:-1}

if ! [[ "$NUM_KEYS" =~ ^[0-9]+$ ]] || [ "$NUM_KEYS" -lt 1 ] || [ "$NUM_KEYS" -gt 10 ]; then
    echo -e "${RED}❌ Error: Número de claves debe ser entre 1 y 10${NC}"
    exit 1
fi

# Generar claves
echo -e "${GREEN}🔑 Generando $NUM_KEYS clave(s) de encriptación...${NC}"
echo ""

for i in $(seq 1 $NUM_KEYS); do
    if [ "$NUM_KEYS" -gt 1 ]; then
        echo -e "${YELLOW}Clave #$i:${NC}"
    fi

    # Generar clave
    KEY=$(openssl rand -base64 32)
    echo -e "${GREEN}$KEY${NC}"

    # Verificar longitud
    KEY_LENGTH=${#KEY}
    if [ $KEY_LENGTH -ne 44 ]; then
        echo -e "${RED}⚠️  Advertencia: Longitud inesperada ($KEY_LENGTH caracteres)${NC}"
    fi

    echo ""
done

# Información adicional
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}📋 Instrucciones:${NC}"
echo ""
echo "1. Copia la(s) clave(s) generada(s) arriba"
echo "2. Guárdalas en un gestor de contraseñas seguro:"
echo "   • 1Password"
echo "   • Bitwarden"
echo "   • LastPass"
echo "   • AWS Secrets Manager"
echo ""
echo "3. Configura en Vercel:"
echo "   • Ve a: Settings → Environment Variables"
echo "   • Name: ENCRYPTION_KEY"
echo "   • Value: [pegar clave]"
echo "   • Environment: Preview (staging) o Production"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANTE:${NC}"
echo "   • Usa claves DIFERENTES para Staging y Producción"
echo "   • NUNCA commitees estas claves a Git"
echo "   • Rota las claves cada 3-6 meses"
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Verificación de entropía
echo ""
echo -e "${GREEN}🔒 Verificación de seguridad:${NC}"
echo "   Algoritmo: OpenSSL rand (CSPRNG)"
echo "   Longitud: 32 bytes (256 bits)"
echo "   Formato: Base64"
echo "   Entropía: ~256 bits (máxima seguridad)"
echo ""

# Guía de rotación
if [ "$NUM_KEYS" -eq 1 ]; then
    echo -e "${YELLOW}📅 Rotación de claves:${NC}"
    echo "   Para rotar esta clave en el futuro:"
    echo "   1. Genera una nueva clave con este script"
    echo "   2. Ejecuta: ./scripts/rotate-encryption-key.sh"
    echo "   3. Actualiza la variable en Vercel"
    echo "   4. Documenta en ENCRYPTION_KEYS_SETUP.md"
    echo ""
fi

echo -e "${GREEN}✅ Generación completada${NC}"
