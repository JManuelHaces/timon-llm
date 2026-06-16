"""Agrega el directorio backend al sys.path para que pytest encuentre app/."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
