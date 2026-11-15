# Hosting saray-app on one Windows laptop

This folder lets you run **one separate copy** of the app for one yurt, on that yurt's laptop:
the app and the database both live on the laptop, and the yurt reaches it through one
public web address (also from phones on other networks).

```
 phone / any browser ──https──▶ public address ──tunnel──▶ laptop:3001 ──▶ MySQL (same laptop)
                                (Tailscale Funnel)          app + web pages
```

Nothing from the main yurt is copied. The database starts **empty**: structure only, no talebeler,
no users from anywhere else.

> **Status of this kit.** The code, the empty database, the first-admin script, login, serving the
> web app and the address checks were tested on a Linux test machine. The **PowerShell scripts and
> the Tailscale steps could not be run there** (no Windows, no Tailscale account). Do the first
> installation yourself with the laptop in front of you, and read each script's message.

---

## 0. What you need

- The Windows laptop (plugged in, always on, internet). Windows 10/11.
- An account for **Tailscale** (free). Sign up with an email that belongs to you (not a yurt-only mailbox you could lose).
- An **external USB drive** (or second disk) for backups.
- The branch `feature/new-yurt-demo`, **committed and pushed by you** to GitHub (the laptop will clone it).

Keep the repository in a path **without spaces**, for example `C:\saray-app`.

## 1. Install the software (once)

1. **Git for Windows** – https://git-scm.com/download/win (defaults are fine).
2. **Node.js 22 LTS** – https://nodejs.org (the installer adds Node to the system PATH).
3. **MySQL 8.0 Community Server** – https://dev.mysql.com/downloads/installer/
   - Choose "Server only".
   - Config type "Development Computer" is fine. **Keep "Open Windows Firewall port for network access" UNCHECKED** (only this laptop needs to reach the database).
   - Set a strong **root password** and write it down somewhere safe. You need it once (step 5).
   - Leave "Configure MySQL Server as a Windows Service" and "Start at system startup" ON.
4. **Tailscale** – https://tailscale.com/download/windows , sign in.

Open PowerShell (normal) once and allow scripts for that window only:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

(Do this again in every new PowerShell window, or start scripts as
`powershell -ExecutionPolicy Bypass -File .\deploy\scripts\<name>.ps1`.)

## 2. Get the code

```powershell
cd C:\
git clone -b feature/new-yurt-demo https://github.com/ydgn43/saray-app.git saray-app
cd C:\saray-app
```

If the repository is private, Git asks you to sign in to GitHub the first time.

## 3. Get the public address (Tailscale Funnel)

Why Tailscale Funnel: it gives a **free, fixed `https://…ts.net` address**, needs **no router settings**,
and does **not touch any domain** – so `efendim.nl` and the main yurt stay completely untouched.

1. In the Tailscale admin page (https://login.tailscale.com/admin):
   - **DNS** → turn on **HTTPS Certificates**.
   - **Machines** → rename this laptop to something short, e.g. `saray-yurt`. The address becomes
     `https://saray-yurt.<your-tailnet-name>.ts.net`. (A "tailnet name" like `tail1a2b3.ts.net` is shown on the DNS page.)
2. In PowerShell run:

   ```powershell
   tailscale funnel --bg 3001
   ```

   The first time, it prints a link to allow **Funnel** for this laptop – open it and approve.
   Run `tailscale funnel status` and **write down the https address** it shows. That is your public address (called `PUBLIC_URL` below).

   Funnel stays on after restarts. The app does not have to be running yet.

People do **not** need Tailscale on their phones. They just open the address in a browser.

## 4. Configure the app

```powershell
cd C:\saray-app
.\deploy\scripts\1-create-config.ps1 -PublicUrl https://saray-yurt.tail1a2b3.ts.net
```

This creates `backend\config.env` with a **fresh random database password and a fresh random login secret**
and your public address. The file is private (git ignores it). Do not send it to anybody and never copy
the secret from another instance.

## 5. Create the empty database

```powershell
.\deploy\scripts\2-setup-database.ps1
```

It asks for the MySQL **root password** (step 1), creates the database `saray_appdb` and a database user `saray_app`,
and loads the structure plus the three migrations in order. It refuses to run if the database already has tables.

## 6. Build the web app and create the first yurt + admin

```powershell
.\deploy\scripts\3-build.ps1
node deploy\tools\create-first-admin.js --yurt "Yeni Yurt" --admin admin --super-admin owner
```

- `3-build.ps1` installs packages and builds the web app for your public address (takes a few minutes).
- The second command asks for two passwords (min. 10 characters): for the **admin** (the yurt's main user –
  this is the daily account) and for the **super-admin** (the owner account that can later add more yurts and accounts).
- The names `Yeni Yurt`, `admin` and `owner` are only placeholders. You can use other names now. The yurt can be renamed later in the app.
- It creates one yurt, the two users and the default lists (var/yok/gec/izinli and the izinli reasons). **No talebeler.**
- It refuses to run again once a yurt exists.

## 7. Start it, and keep it running

Open PowerShell **as Administrator**:

```powershell
cd C:\saray-app
.\deploy\scripts\4-register-startup.ps1
.\deploy\scripts\6-laptop-settings.ps1
```

- `4-register-startup.ps1` starts the app now and every time the laptop boots (no login needed). If it stops, it restarts itself.
- `6-laptop-settings.ps1` stops the laptop from sleeping while plugged in and ignores lid closing. Keep the charger in.
- In Windows: Settings → Windows Update → Advanced options → set **Active hours**.
- Recommended: turn on **BitLocker / Device encryption** (Settings → Privacy & security → Device encryption). The laptop will hold private data of the talebeler.

Test:

1. On the laptop: open http://localhost:3001/health → should say `"status":"OK"`.
2. On your **phone with Wi-Fi switched off** (mobile data): open the public address, log in as `admin`.

## 8. Backups (do not skip)

Plug in the USB drive (say it is `E:`):

```powershell
.\deploy\scripts\5-register-backup.ps1 -SecondLocation E:\saray-backups
Start-ScheduledTask -TaskName SarayBackup        # try it once now
```

Every night at 03:00 a compressed copy of the database goes to `C:\saray-data\backups` **and** to the USB drive;
the newest 30 are kept. Check once that a `.zip` appears in both places. The USB drive must be plugged in at night
(if not, the copy on the laptop is still made and the script reports the problem in its output).

Backups contain private data. Keep the USB drive in a safe place.

### Restoring a backup

1. Stop the app: `Stop-ScheduledTask -TaskName SarayApp; Get-Process node | Stop-Process -Force`
2. Unzip the chosen `saray_appdb_….zip` to get the `.sql` file.
3. In PowerShell (use your own paths; it asks for the MySQL root password):

   ```powershell
   & "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p -e "DROP DATABASE saray_appdb; CREATE DATABASE saray_appdb CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci; GRANT ALL ON saray_appdb.* TO 'saray_app'@'localhost'; GRANT ALL ON saray_appdb.* TO 'saray_app'@'127.0.0.1';"
   & "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p saray_appdb -e "source C:/path/to/saray_appdb_2026-11-14_03-00.sql"
   ```
4. Start the app: `Start-ScheduledTask -TaskName SarayApp`

(This was tested on the Linux machine with the same dump options.)

## 9. Daily life

| What | How |
| --- | --- |
| Is it running? | open `http://localhost:3001/health` on the laptop |
| Logs | `C:\saray-data\logs\app-<date>.log` (kept 30 days). They are private: see "Known limits". |
| Restart | `Stop-ScheduledTask -TaskName SarayApp; Get-Process node \| Stop-Process -Force; Start-ScheduledTask -TaskName SarayApp` |
| Update to newer code | `.\deploy\scripts\update.ps1 -SecondLocation E:\saray-backups` (backup → `git pull` → rebuild → restart) |
| Database changes in an update | **not automatic.** New files in `db\migrations` are applied by hand, after a backup, once. |
| Add more yurts or accounts | log in as the super-admin (`owner`) and use the super-admin page of the app |

## 10. Option B: Cloudflare Tunnel (only if you really need your own domain name)

Cloudflare Tunnel also needs no router settings, but it needs a **domain whose DNS is managed by Cloudflare**.
Because `efendim.nl` is in use by the main yurt, **do not move it to Cloudflare for this** – that would put the
main yurt's address at risk. Use this option only with a **separate domain** bought for it.

1. Add the new domain to a free Cloudflare account (change its name servers as Cloudflare says).
2. Cloudflare dashboard → Zero Trust → Networks → Tunnels → create a tunnel, choose Windows, and run the
   install command it gives you in PowerShell (as Administrator). It installs `cloudflared` as a Windows service that starts at boot.
3. Add a "Public hostname", e.g. `app.<newdomain>` → service `HTTP` → `localhost:3001`.
4. Use `https://app.<newdomain>` as `-PublicUrl` in step 4 (instead of the ts.net address) and skip step 3.

Do **not** use the random `trycloudflare.com` quick tunnels: the address changes at every restart.

## 11. Known limits (read once)

- **The login page is public on the internet.** There is no limit on wrong password attempts yet. Use long
  passwords (the first-admin script enforces 10+ characters) and do not give out reference codes casually.
- **The database password is printed into the log when the app starts** (existing behaviour of `data/sequelize.ts`,
  not changed here). So keep the `C:\saray-data\logs` folder private.
- The code still contains old fallback login secrets. In this hosting mode the app **refuses to start** unless
  `JWT_SECRET` is a real random value of at least 32 characters.
- The app listens on all network cards of the laptop. Inside the same Wi-Fi others could reach it too; the login still protects it.
- Funnel has bandwidth limits set by Tailscale. That is plenty for attendance work, not for large downloads.
- **Privacy law:** student data of minors is personal data. If this yurt is in a different country than the main one,
  check the local rules (for the EU: GDPR) before real data goes in. You, as the person running it for them, may be responsible.
- One laptop is one point of failure: keep the backups current and test a restore once.

## 12. Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| `FATAL: SERVE_FRONTEND=true requires a random JWT_SECRET…` | `backend\config.env` has no real secret. Run `1-create-config.ps1` (new file) or put a 64-character random value in. |
| `FATAL: … frontend\build\index.html does not exist` | run `3-build.ps1` |
| Page opens, login says "CORS not allowed" or the network fails | the address in `ALLOWED_ORIGINS` is not exactly the address in the browser (https, no slash, same spelling); change it in `config.env`, restart; if the address itself changed, run `3-build.ps1` again |
| Address does not open from the phone | `tailscale funnel status` – Funnel must be on; the laptop must be online; the app must be running (`/health`) |
| `Access denied for user 'saray_app'` | the database password in `config.env` does not match MySQL – delete nothing; rerun `2-setup-database.ps1` only on an EMPTY database, otherwise reset the user's password in MySQL to the value in `config.env` |
| App not running after reboot | `Get-ScheduledTask SarayApp` and look at the newest log in `C:\saray-data\logs` |
