---
title: "Lab 01 - Automate Server Setup ด้วย Ansible"
---

## เป้าหมาย

- ติดตั้ง Ansible และ setup inventory
- รัน ad-hoc commands
- เขียน playbook ติดตั้ง Nginx และ deploy web app
- ใช้ Ansible Vault เก็บ secrets

## สิ่งที่ต้องมี


:::note[Requirements]
```bash
# ติดตั้ง Ansible
pip install ansible

# หรือ
sudo apt install ansible          # Ubuntu
brew install ansible              # macOS

ansible --version

# ต้องมี Docker สำหรับ simulate target servers
docker --version
```
:::

---

## Setup — สร้าง Target Servers ด้วย Docker

เราจะใช้ Docker containers แทน VM เพื่อ simulate managed nodes

```bash
mkdir ~/ansible-lab && cd ~/ansible-lab

# สร้าง SSH key สำหรับ Ansible
ssh-keygen -t ed25519 -f ansible_key -N ""
```

สร้าง `Dockerfile.target`:
```dockerfile
FROM ubuntu:22.04

RUN apt-get update && apt-get install -y \
    openssh-server \
    python3 \
    sudo \
    && rm -rf /var/lib/apt/lists/*

RUN useradd -m -s /bin/bash ansible && \
    echo "ansible ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers && \
    mkdir -p /home/ansible/.ssh && \
    chmod 700 /home/ansible/.ssh

COPY ansible_key.pub /home/ansible/.ssh/authorized_keys
RUN chmod 600 /home/ansible/.ssh/authorized_keys && \
    chown -R ansible:ansible /home/ansible/.ssh

RUN mkdir /var/run/sshd
EXPOSE 22
CMD ["/usr/sbin/sshd", "-D"]
```

สร้าง `docker-compose.yml`:
```yaml
services:
  web-01:
    build:
      context: .
      dockerfile: Dockerfile.target
    container_name: web-01
    hostname: web-01
    ports:
      - "2221:22"

  web-02:
    build:
      context: .
      dockerfile: Dockerfile.target
    container_name: web-02
    hostname: web-02
    ports:
      - "2222:22"

  db-01:
    build:
      context: .
      dockerfile: Dockerfile.target
    container_name: db-01
    hostname: db-01
    ports:
      - "2223:22"
```

```bash
docker compose up -d --build

# ทดสอบ SSH เข้า container
ssh -i ansible_key -p 2221 -o StrictHostKeyChecking=no ansible@localhost "echo connected"
```

---

## Exercise 1 — Inventory และ Ping

สร้าง `inventory.ini`:
```ini
[webservers]
web-01 ansible_host=localhost ansible_port=2221
web-02 ansible_host=localhost ansible_port=2222

[databases]
db-01 ansible_host=localhost ansible_port=2223

[all:vars]
ansible_user=ansible
ansible_ssh_private_key_file=./ansible_key
ansible_ssh_common_args='-o StrictHostKeyChecking=no'
```

```bash
# ทดสอบ connectivity
ansible all -i inventory.ini -m ping

# ผลลัพธ์ที่ควรได้:
# web-01 | SUCCESS => {"ping": "pong"}
# web-02 | SUCCESS => {"ping": "pong"}
# db-01  | SUCCESS => {"ping": "pong"}

# ดู facts ของ server
ansible web-01 -i inventory.ini -m setup | grep -E "ansible_os|ansible_hostname|ansible_memory"
```

---

## Exercise 2 — Ad-hoc Commands

```bash
# ดู uptime ทุก server
ansible all -i inventory.ini -m command -a "uptime"

# ดู disk usage
ansible all -i inventory.ini -m command -a "df -h"

# ติดตั้ง package (เฉพาะ webservers)
ansible webservers -i inventory.ini -m apt \
  -a "name=curl state=present update_cache=yes" \
  --become

# ตรวจสอบว่าติดตั้งแล้ว
ansible webservers -i inventory.ini -m command -a "curl --version"

# copy ไฟล์ไปทุก server
echo "Hello from Ansible" > hello.txt
ansible all -i inventory.ini -m copy \
  -a "src=hello.txt dest=/tmp/hello.txt"

# ตรวจสอบ
ansible all -i inventory.ini -m command -a "cat /tmp/hello.txt"
```

---

## Exercise 3 — Playbook ติดตั้ง Nginx

สร้าง `nginx.yml`:
```yaml
---
- name: Setup Nginx Web Servers
  hosts: webservers
  become: true

  vars:
    nginx_port: 80
    site_name: "DevOps Lab"

  tasks:
    - name: Update apt cache
      apt:
        update_cache: true
        cache_valid_time: 3600

    - name: Install nginx
      apt:
        name: nginx
        state: present

    - name: Create custom index.html
      copy:
        content: |
          <html>
          <body>
            <h1>{{ site_name }}</h1>
            <p>Server: {{ inventory_hostname }}</p>
            <p>IP: {{ ansible_host }}</p>
          </body>
          </html>
        dest: /var/www/html/index.html
        mode: "0644"

    - name: Start and enable nginx
      service:
        name: nginx
        state: started
        enabled: true

    - name: Verify nginx is running
      uri:
        url: "http://localhost:{{ nginx_port }}"
        status_code: 200
      register: result

    - name: Show result
      debug:
        msg: "Nginx is running on {{ inventory_hostname }}: {{ result.status }}"
```

```bash
# Dry run ก่อน
ansible-playbook -i inventory.ini nginx.yml --check

# รันจริง
ansible-playbook -i inventory.ini nginx.yml

# ทดสอบ
curl http://localhost:2221/    # จะได้ port mapping ผ่าน SSH tunnel
# หรือ
ansible webservers -i inventory.ini -m uri -a "url=http://localhost return_content=yes"
```

---

## Exercise 4 — Handlers และ Templates

สร้าง `templates/nginx.conf.j2`:
```nginx
server {
    listen {{ nginx_port }};
    server_name {{ inventory_hostname }};

    root /var/www/html;
    index index.html;

    access_log /var/log/nginx/{{ inventory_hostname }}_access.log;

    location / {
        try_files $uri $uri/ =404;
    }
}
```

สร้าง `nginx-template.yml`:
```yaml
---
- name: Nginx with Template and Handler
  hosts: webservers
  become: true

  vars:
    nginx_port: 80

  tasks:
    - name: Install nginx
      apt:
        name: nginx
        state: present
        update_cache: true

    - name: Deploy nginx config from template
      template:
        src: templates/nginx.conf.j2
        dest: /etc/nginx/sites-available/default
        mode: "0644"
      notify: Reload nginx        # trigger handler เมื่อ config เปลี่ยน

    - name: Enable site
      file:
        src: /etc/nginx/sites-available/default
        dest: /etc/nginx/sites-enabled/default
        state: link

    - name: Start nginx
      service:
        name: nginx
        state: started
        enabled: true

  handlers:
    - name: Reload nginx          # รันเฉพาะเมื่อมี notify
      service:
        name: nginx
        state: reloaded
```

```bash
ansible-playbook -i inventory.ini nginx-template.yml -v

# รันซ้ำ — handler จะไม่ทำงานเพราะ config ไม่ได้เปลี่ยน (idempotent)
ansible-playbook -i inventory.ini nginx-template.yml -v
```

---

## Exercise 5 — Ansible Vault (Encrypt Secrets)

```bash
# สร้าง encrypted secrets file
ansible-vault create secrets.yml
# ใส่ password vault เช่น "vaultpass123"
# แล้วพิมพ์:
# db_password: supersecret
# api_key: myapikey123456

# ดู encrypted file
cat secrets.yml

# แก้ไข
ansible-vault edit secrets.yml

# ใช้ใน playbook
cat > use-secrets.yml << 'EOF'
---
- name: Use Secrets
  hosts: databases
  become: true
  vars_files:
    - secrets.yml

  tasks:
    - name: Show masked secret (last 4 chars only)
      debug:
        msg: "DB Password ends with: ...{{ db_password[-4:] }}"
EOF

ansible-playbook -i inventory.ini use-secrets.yml --ask-vault-pass
```

---

## Cleanup

```bash
docker compose down
rm -f ansible_key ansible_key.pub hello.txt
```

---


:::tip[สำเร็จแล้ว!]
คุณใช้ Ansible automate server configuration ได้แล้ว ทั้ง ad-hoc, playbook, template, handler, และ vault
:::


:::note[Challenge]
สร้าง playbook สำหรับ setup **LEMP stack** (Linux + Nginx + MySQL + PHP) บน web servers ทั้งหมด
โดยแยกเป็น 2 plays:
1. Play แรกติดตั้ง Nginx + PHP บน `webservers`
2. Play ที่สองติดตั้ง MySQL บน `databases` พร้อม encrypted password ใน Vault
:::
