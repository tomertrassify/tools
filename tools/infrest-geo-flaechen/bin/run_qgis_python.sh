#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
QGIS_APP="/Applications/QGIS.app/Contents"
QGIS_PYTHON="${QGIS_APP}/MacOS/python3.12"
PYTHON_HOME_DIR="/tmp/infrest-geo-flaechen-qgispy-${EUID}"
PYTHON_LIB_DIR="${PYTHON_HOME_DIR}/lib"

mkdir -p "${PYTHON_LIB_DIR}"
if [ ! -L "${PYTHON_LIB_DIR}/python3.12" ]; then
  rm -rf "${PYTHON_LIB_DIR}/python3.12"
  ln -s "${QGIS_APP}/Resources/python3.11" "${PYTHON_LIB_DIR}/python3.12"
fi

export PYTHONHOME="${PYTHON_HOME_DIR}"
export PROJ_DATA="${QGIS_APP}/Resources/qgis/proj"
export DYLD_FRAMEWORK_PATH="${QGIS_APP}/Frameworks"
export DYLD_LIBRARY_PATH="${QGIS_APP}/Frameworks"

exec "${QGIS_PYTHON}" "$@"
