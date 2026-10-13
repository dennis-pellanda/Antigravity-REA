# REA - Reverse Engineering Assistant & Firmware Analysis

Workspace dedicato all'analisi di firmware, reverse engineering e riproduzione di ambienti web integrati, incentrato sull'ecosistema hardware **Zyxel NR7101 5G**.

---

## 📁 Struttura del Repository

```text
├── rea-main/             # Reverse Engineering Assistant (REA) toolchain, MCP servers & runtime
├── Zyxel NR7101/         # Immagini firmware originali e aggiornamenti (es. V1.00(ABUV.11)C0)
├── work/                 # Workspace di estrazione, disassemblaggio e simulazione
│   ├── server.mjs        # Server di emulazione Node.js per la Web GUI (Vue.js)
│   ├── extracted_rootfs/ # Filesystem root estratto dal firmware
│   ├── vmlinux.bin       # Immagine kernel decompresso MIPS/ARM
│   └── uncompressed_gzip.bin
├── .gitignore            # Regole di esclusione file temporanei e di sistema
└── README.md
```

---

## 🔍 Componenti Principali

### 1. `rea-main`
Contiene la suite **REA (Reverse Engineering Assistant)** con i relativi tool, server MCP (Model Context Protocol) e bridge per l'interazione con disassemblatori, debugger e analizzatori di codice nativo e Web.

### 2. Analisi Firmware Zyxel NR7101
L'archivio firmware `100ABUV11C0.bin` (architettura basata su OpenWrt/Linux per router 5G outdoor Zyxel NR7101) è stato dissezionato nei suoi componenti:
- **Bootloader & Kernel**: Estrazione del kernel Linux `vmlinux.bin`.
- **Root Filesystem (`extracted_rootfs`)**: Albero completo del sistema operativo del dispositivo con script di pre-inizializzazione, configurazioni OpenWrt (`/etc/config`), certificati e demone di gestione.
- **Web Management GUI (`extracted_rootfs/web`)**: Interfaccia di configurazione basata su Vue.js, Bootstrap 4 e chiamate API criptate (AES / RSA).

### 3. Emulatore Web GUI (`work/server.mjs`)
Script Node.js che riproduce in locale le risposte e il routing della Web GUI del router Zyxel, consentendo di testare e analizzare l'interfaccia utente, le chiamate REST e le risposte JSON senza bisogno del dispositivo fisico collegato.

---

## 🚀 Avvio Rapido

### Esecuzione del server di emulazione locale
```bash
node work/server.mjs
```
Il server avvierà la Web GUI sulla porta `8080`, servendo i file statici e simulando gli endpoint API di `extracted_rootfs/web`.
