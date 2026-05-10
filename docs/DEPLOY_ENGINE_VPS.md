# Panduan deploy Crucible Engine ke VPS (dari nol)

Panduan ini untuk menjalankan **broker engine** (`packages/engine`) di VPS Linux (mis. Hostinger) dengan SSH aman, Node.js, dan PM2 agar proses tetap hidup setelah reboot.

**Asumsi:**

- Laptop kamu macOS (kalau Windows/WSL, langkah SSH key sedikit beda).
- VPS Ubuntu 22.04 atau 24.04 LTS (umum di Hostinger).
- Repo sudah ada di GitHub/GitLab (public atau private).

---

## Bagian A — Buat SSH key di laptop (sekali saja)

### 1. Cek apakah sudah punya key

Di Terminal:

```bash
ls -la ~/.ssh
```

Kalau sudah ada file seperti `id_ed25519` dan `id_ed25519.pub`, kamu bisa pakai itu dan **loncat ke Bagian B**. Kalau belum, lanjut.

### 2. Buat key baru (Ed25519, direkomendasikan)

```bash
ssh-keygen -t ed25519 -C "email-kamu@example.com" -f ~/.ssh/id_ed25519
```

- Tekan Enter untuk passphrase kosong (praktis tapi kurang aman), atau isi passphrase (lebih aman).
- Jangan share file **`id_ed25519`** (private). Yang boleh dibagikan hanya **`.pub`**.

### 3. Jalankan ssh-agent dan tambahkan key

```bash
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519
```

### 4. Salin public key ke clipboard

```bash
pbcopy < ~/.ssh/id_ed25519.pub
```

Isi file `.pub` itu satu baris, bentuknya `ssh-ed25519 AAAA... comment`.

### 5. (Kalau pakai GitHub/GitLab untuk `git clone`)

- **GitHub:** Settings → SSH and GPG keys → New SSH key → paste.
- **GitLab:** Preferences → SSH Keys → paste.

Ini dipakai supaya VPS bisa `git clone` pakai URL `git@github.com:...` **hanya kalau** kamu nanti setup deploy key atau clone dari laptop lalu rsync. Untuk panduan ini kita **clone dari VPS pakai HTTPS** atau SSH dengan key yang **kamu tambahkan ke GitHub sebagai Deploy Key** read-only untuk repo itu.

**Opsi simpel:** clone pakai HTTPS di VPS (`git clone https://github.com/...`) — tidak perlu SSH key GitHub di VPS, cukup token/kredensial kalau repo private.

---

## Bagian B — Pertama kali masuk ke VPS

### 1. Temukan IP VPS dan user

Di panel Hostinger: catat **IP publik** VPS. User awal biasanya `root` atau user yang Hostinger berikan.

### 2. Tambahkan public key ke VPS (agar login tanpa password)

**Cara A — dari Hostinger panel**

Kalau ada menu untuk paste **SSH public key**, paste isi `~/.ssh/id_ed25519.pub`.

**Cara B — manual (punya password root sekali)**

Dari laptop:

```bash
ssh root@IP_VPS_KAMU
```

Lalu di VPS:

```bash
mkdir -p ~/.ssh
chmod 700 ~/.ssh
nano ~/.ssh/authorized_keys
```

Paste baris public key (yang sama dari `id_ed25519.pub`), simpan (`Ctrl+O`, Enter, `Ctrl+X`).

```bash
chmod 600 ~/.ssh/authorized_keys
```

Keluar (`exit`), coba lagi dari laptop:

```bash
ssh root@IP_VPS_KAMU
```

Seharusnya masuk tanpa password (atau hanya passphrase key).

### 3. (Sangat disarankan) Buat user non-root dan sudo

Di VPS sebagai `root`:

```bash
adduser deploy
usermod -aG sudo deploy
rsync --archive --chown=deploy:deploy ~/.ssh /home/deploy
```

Test login:

```bash
ssh deploy@IP_VPS_KAMU
```

Selanjutnya pakai user **`deploy`** (bukan root) untuk instalasi.

---

## Bagian C — Sekuritas dasar VPS

Sebagai user dengan sudo:

### 1. Update sistem

```bash
sudo apt update && sudo apt upgrade -y
```

### 2. Firewall (UFW)

Engine ini **tidak perlu** membuka port HTTP ke internet untuk kerja dasar (hanya outbound ke RPC 0G). Cukup SSH:

```bash
sudo ufw allow OpenSSH
sudo ufw enable
sudo ufw status
```

---

## Bagian D — Git, build tools, Node.js

### 1. Paket dasar

```bash
sudo apt install -y git curl build-essential
```

### 2. Node.js 20 (sesuai `engines` monorepo)

Pakai **nvm** supaya versi Node mudah dikontrol:

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
```

Tutup terminal, buka lagi SSH, lalu:

```bash
nvm install 20
nvm use 20
node -v   # harus v20.x.x
npm -v
```

---

## Bagian E — Clone repo dan install

### 1. Clone

Di home user, misalnya:

```bash
cd ~
git clone https://github.com/ORGANISASI/0G_agentswarm.git crucible
cd crucible
```

Kalau repo **private**, GitHub akan minta token (PAT) sebagai password saat HTTPS, atau setup SSH deploy key.

### 2. Install dependency monorepo

```bash
npm install
```

### 3. Compile kontrak (wajib — shared mengimpor ABI dari artifacts)

```bash
npm run compile -w @crucible/contracts
```

Kalau langkah ini gagal, **jangan** lanjut — engine tidak akan jalan.

---

## Bagian F — File `.env` di root monorepo

Engine memuat env dari **`../../.env` relatif ke `packages/engine`** saat dijalankan lewat npm workspace; praktik teraman: simpan **`.env` di root repo** (`~/crucible/.env`).

Salin contoh:

```bash
cp .env.example .env
nano .env
```

Isi minimal (sesuaikan nilai asli kamu):

| Variabel | Keterangan |
|----------|------------|
| `OG_RPC_URL` | RPC 0G testnet, mis. `https://evmrpc-testnet.0g.ai` |
| `OG_CHAIN_ID` | `16602` untuk Galileo testnet |
| `OG_STORAGE_INDEXER_URL` | Mis. `https://indexer-testnet.0g.ai` |
| `PRIVATE_KEY` | Private key wallet coordinator format `0x` + 64 hex — **rahasia**, jangan commit |
| `OG_COMPUTE_PROVIDER_ADDRESS` | Alamat provider compute 0G (bukan placeholder nol kalau dipakai) |
| `OG_MODEL` | Opsional, default bisa `qwen-2.5-7b-instruct` |

**Alamat kontrak:** di kode, default sudah mengarah ke deployment testnet di `packages/shared/src/contracts.ts`. Kalau kamu redeploy, set override env (nama variabel mengikuti yang dipakai shared, berawalan `NEXT_PUBLIC_` meskipun untuk engine):

- `NEXT_PUBLIC_REGISTRY_ADDRESS`
- `NEXT_PUBLIC_ESCROW_ADDRESS`
- `NEXT_PUBLIC_JUDGE_ADDRESS`
- `NEXT_PUBLIC_INFT_ADDRESS`
- `NEXT_PUBLIC_VAULT_ADDRESS`

**Demo BadBot (opsional):** kalau pakai skenario demo slash:

- `BADBOT_ADDRESS=<alamat_agent_demo_yang_gagal>`

Simpan file, permission ketat:

```bash
chmod 600 .env
```

---

## Bagian G — PM2 (proses tetap jalan)

### 1. Install PM2 global

```bash
npm install -g pm2
```

### 2. Jalankan engine dari root monorepo

Script resmi engine memakai **`ts-node`** (`npm run start -w @crucible/engine`). Jalankan dengan PM2:

```bash
cd ~/crucible
pm2 start npm --name crucible-engine --cwd ~/crucible -- run start -w @crucible/engine
```

**Penting:** `--cwd` harus mengarah ke **root folder monorepo** tempat `package.json` workspaces, **bukan** hanya `packages/engine`.

### 3. Cek log

```bash
pm2 logs crucible-engine
```

Biarkan beberapa menit; kalau ada error RPC atau env, akan keluar di log.

### 4. Auto-start saat VPS reboot

```bash
pm2 save
pm2 startup
```

PM2 akan mengeluarkan perintah `sudo env PATH=...` — **jalankan persis** perintah yang ditampilkan (copy-paste), lalu:

```bash
pm2 save
```

---

## Bagian H — Operasi sehari-hari

| Tindakan | Perintah |
|----------|----------|
| Lihat status | `pm2 status` |
| Restart setelah ubah `.env` atau `git pull` | `pm2 restart crucible-engine` |
| Log terbaru | `pm2 logs crucible-engine --lines 100` |
| Stop | `pm2 stop crucible-engine` |

**Update kode:**

```bash
cd ~/crucible
git pull
npm install
npm run compile -w @crucible/contracts
pm2 restart crucible-engine
```

---

## Bagian I — Troubleshooting

1. **`Cannot find module ... artifacts`**  
   Jalankan lagi: `npm run compile -w @crucible/contracts`.

2. **RPC / redirect / fetch error di Node**  
   Repo punya workaround untuk Node tertentu (`setupEthersWorkaround`). Kalau masalah tetap ada, coba Node versi lain (mis. 22) setelah membaca `CLAUDE.md` / `AGENTS.md` di root repo.

3. **Environment tidak kebaca**  
   Pastikan `.env` ada di **root monorepo** (`~/crucible/.env`), dan PM2 di-start dengan `--cwd ~/crucible` seperti di atas.

4. **Private key / tx gagal**  
   Pastikan wallet punya **native token testnet** untuk gas di 0G Galileo.

---

## Ringkasan arsitektur

- **VPS ini:** hanya mesin untuk menjalankan **engine** (daemon Node + PM2).
- **Frontend** Next.js bisa tetap di **Vercel**; tidak wajib di VPS yang sama.
- **Kontrak** sudah di-deploy ke chain; engine berbicara ke RPC + indexer + (jika dipakai) compute provider.

Kalau kamu mau langkah yang sama tapi pakai **Docker**, repo ini belum menyediakan Dockerfile resmi — bisa ditambahkan terpisah dengan menyalin pola env dan perintah di atas ke image.
