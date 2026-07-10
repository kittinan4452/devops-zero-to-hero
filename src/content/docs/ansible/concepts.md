---
title: "Ansible Concepts"
---

Ansible คือ IT automation tool สำหรับ configuration management, application deployment, และ task automation โดยใช้ YAML เขียน automation แบบ human-readable

---

## Ansible vs Terraform

| | Ansible | Terraform |
|---|---|---|
| **ทำอะไร** | Configuration management | Infrastructure provisioning |
| **ถนัด** | ตั้งค่า OS, install software | สร้าง VM, Network, Cloud resource |
| **State** | Stateless (idempotent) | มี state file |
| **Language** | YAML (Playbook) | HCL |
| **Agent** | Agentless (SSH) | ไม่ต้องการ agent |
| **ใช้ร่วมกัน** | ✓ Terraform สร้าง VM → Ansible config |


:::tip[ใช้ร่วมกัน]
ในทางปฏิบัติ Terraform + Ansible ทำงานคู่กัน:
Terraform สร้าง infrastructure → Ansible ตั้งค่า server
:::

---

## Architecture

```
Control Node (เครื่องที่รัน Ansible)
    │
    │ SSH (ไม่ต้องติดตั้ง agent บน target)
    │
    ├── Managed Node 1 (web-01)
    ├── Managed Node 2 (web-02)
    └── Managed Node 3 (db-01)
```

**Agentless** — ไม่ต้องติดตั้งอะไรบน target server นอกจาก Python และ SSH

---

## Components หลัก

### Inventory
ไฟล์บอกว่าจะ manage server ไหนบ้าง

```ini
# inventory.ini
[webservers]
web-01 ansible_host=192.168.1.10
web-02 ansible_host=192.168.1.11

[databases]
db-01 ansible_host=192.168.1.20

[production:children]
webservers
databases
```

```yaml
# inventory.yml (YAML format)
all:
  children:
    webservers:
      hosts:
        web-01:
          ansible_host: 192.168.1.10
        web-02:
          ansible_host: 192.168.1.11
    databases:
      hosts:
        db-01:
          ansible_host: 192.168.1.20
```

### Playbook
ชุดคำสั่งที่บอกว่าจะทำอะไรกับ server ไหน

```yaml
# site.yml
---
- name: Setup Web Servers
  hosts: webservers          # รันกับ group นี้
  become: true               # sudo
  vars:
    app_port: 8080

  tasks:
    - name: Update apt cache
      apt:
        update_cache: true
        cache_valid_time: 3600

    - name: Install nginx
      apt:
        name: nginx
        state: present

    - name: Start nginx
      service:
        name: nginx
        state: started
        enabled: true

    - name: Copy config file
      template:
        src: nginx.conf.j2
        dest: /etc/nginx/nginx.conf
      notify: Restart nginx

  handlers:
    - name: Restart nginx
      service:
        name: nginx
        state: restarted
```

### Module
คำสั่งสำเร็จรูปสำหรับงานต่างๆ

```yaml
tasks:
  # จัดการ package
  - apt: { name: nginx, state: present }
  - yum: { name: httpd, state: latest }
  - pip: { name: flask, version: "2.0" }

  # จัดการไฟล์
  - copy: { src: app.conf, dest: /etc/app.conf }
  - template: { src: nginx.j2, dest: /etc/nginx.conf }
  - file: { path: /var/log/app, state: directory, mode: "0755" }

  # รัน command
  - command: /usr/bin/app --init
  - shell: echo $HOME > /tmp/home.txt
  - script: /local/script.sh

  # จัดการ service
  - service: { name: nginx, state: started, enabled: true }
  - systemd: { name: app, state: restarted, daemon_reload: true }

  # User management
  - user: { name: deploy, groups: sudo, shell: /bin/bash }

  # Docker
  - docker_container: { name: web, image: nginx, ports: ["80:80"] }
```

### Variables

```yaml
# group_vars/webservers.yml
app_version: "1.0"
app_port: 8080
nginx_worker_processes: 4

# host_vars/web-01.yml
ansible_user: ubuntu
ansible_ssh_private_key_file: ~/.ssh/web-01.pem
```

```yaml
# ใช้ตัวแปรใน playbook
tasks:
  - name: Deploy app version {{ app_version }}
    git:
      repo: https://github.com/org/app.git
      version: "{{ app_version }}"
      dest: /opt/app
```

### Template (Jinja2)

```nginx
# templates/nginx.conf.j2
worker_processes {{ nginx_worker_processes }};

server {
    listen {{ app_port }};
    server_name {{ inventory_hostname }};

    {% if ssl_enabled %}
    ssl_certificate /etc/ssl/cert.pem;
    {% endif %}
}
```

### Role
โครงสร้าง reusable สำหรับ task ที่ใช้บ่อย

```
roles/
└── nginx/
    ├── tasks/
    │   └── main.yml      # tasks หลัก
    ├── handlers/
    │   └── main.yml      # handlers
    ├── templates/
    │   └── nginx.conf.j2
    ├── vars/
    │   └── main.yml      # variables
    └── defaults/
        └── main.yml      # default variables
```

```yaml
# ใช้ role ใน playbook
- hosts: webservers
  roles:
    - nginx
    - { role: app, app_port: 9000 }
```

---

## คำสั่งพื้นฐาน

```bash
# ทดสอบ connectivity
ansible all -i inventory.ini -m ping

# รัน command เดียว (ad-hoc)
ansible webservers -i inventory.ini -m command -a "uptime"
ansible webservers -i inventory.ini -m apt -a "name=nginx state=present" --become

# รัน playbook
ansible-playbook -i inventory.ini site.yml

# Dry run (ไม่เปลี่ยนแปลงจริง)
ansible-playbook -i inventory.ini site.yml --check

# รันแค่บาง tag
ansible-playbook -i inventory.ini site.yml --tags "nginx,config"

# รันแค่บาง host
ansible-playbook -i inventory.ini site.yml --limit web-01

# ดู facts ของ host
ansible web-01 -i inventory.ini -m setup

# encrypt secrets
ansible-vault encrypt secrets.yml
ansible-vault decrypt secrets.yml
ansible-playbook site.yml --ask-vault-pass
```

---

## Idempotency

Ansible ทำงานแบบ idempotent — รันกี่ครั้งก็ได้ผลเหมือนกัน ไม่เกิดผลซ้ำซ้อน

```yaml
# รันครั้งแรก: ติดตั้ง nginx
# รันครั้งที่ 2: nginx ติดตั้งแล้ว → ไม่ทำอะไร (ok, not changed)
- apt:
    name: nginx
    state: present
```

---


:::tip[พร้อมแล้ว?]
ไปทำ [Lab 01 - Automate Server Setup](/ansible/lab-01)
:::
