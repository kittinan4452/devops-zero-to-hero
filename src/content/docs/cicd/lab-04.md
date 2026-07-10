---
title: "Lab 04 - ArgoCD (GitOps)"
---

## เป้าหมาย

- เข้าใจแนวคิด **GitOps** — Git เป็น single source of truth
- ติดตั้ง ArgoCD บน Kubernetes (Minikube)
- Deploy app จาก Git repo แล้วให้ ArgoCD **sync** อัตโนมัติ
- ลอง **self-heal** และ **rollback**

## สิ่งที่ต้องมี

:::note[Requirements]
- Minikube หรือ Kubernetes cluster (ดู [Kubernetes Lab 01](/kubernetes/lab-01))
- `kubectl` ติดตั้งแล้ว
- Git repo (public) สำหรับเก็บ manifest
:::

:::tip[GitOps คืออะไร]
แทนที่จะ `kubectl apply` เอง → เก็บ Kubernetes manifest ไว้ใน **Git**
ArgoCD คอย**เทียบ** state ใน cluster กับใน Git ตลอด ถ้าต่างกันก็ดึง Git มาเป็นตัวตั้ง (sync)
**Deploy = git push** และ **rollback = git revert**
:::

---

## Exercise 1 — ติดตั้ง ArgoCD

```bash
minikube start

# สร้าง namespace + ติดตั้ง ArgoCD
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# รอให้ pods พร้อม
kubectl wait --for=condition=available --timeout=300s \
  deployment/argocd-server -n argocd
```

เปิด ArgoCD UI:
```bash
kubectl port-forward svc/argocd-server -n argocd 8080:443
# เปิด https://localhost:8080 (ยอมรับ self-signed cert)
```

เอา password ของ user `admin`:
```bash
kubectl -n argocd get secret argocd-initial-admin-secret \
  -o jsonpath="{.data.password}" | base64 -d; echo
```

---

## Exercise 2 — เตรียม Git Repo ของแอป

สร้าง repo ใหม่ (เช่น `gitops-demo`) แล้วเพิ่มไฟล์ `manifests/deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
spec:
  replicas: 2
  selector:
    matchLabels: { app: web }
  template:
    metadata:
      labels: { app: web }
    spec:
      containers:
      - name: web
        image: nginx:1.25
        ports:
        - containerPort: 80
---
apiVersion: v1
kind: Service
metadata:
  name: web
spec:
  selector: { app: web }
  ports:
  - port: 80
    targetPort: 80
```

```bash
git add manifests/ && git commit -m "feat: initial manifests" && git push
```

---

## Exercise 3 — สร้าง ArgoCD Application

ติดตั้ง ArgoCD CLI แล้ว login:
```bash
# login (ใช้ password จาก Exercise 1)
argocd login localhost:8080 --username admin --insecure
```

สร้าง Application ที่ชี้ไปยัง Git repo:
```bash
argocd app create web-app \
  --repo https://github.com/<your-username>/gitops-demo.git \
  --path manifests \
  --dest-server https://kubernetes.default.svc \
  --dest-namespace default \
  --sync-policy automated       # auto-sync เมื่อ Git เปลี่ยน
```

ดูสถานะ:
```bash
argocd app get web-app
kubectl get pods -l app=web       # ควรเห็น 2 pods ของ nginx
```

หรือดูใน UI: จะเห็น topology ของ Deployment → ReplicaSet → Pods และสถานะ **Synced / Healthy**

---

## Exercise 4 — GitOps จริง: แก้ Git แล้วดู Auto-sync

แก้ `replicas: 2` → `replicas: 4` ใน `manifests/deployment.yaml`:

```bash
git commit -am "scale: 2 -> 4 replicas"
git push
```

ArgoCD จะเห็น diff แล้ว sync ให้อัตโนมัติ (หรือกด **Sync** ใน UI ถ้าไม่ได้เปิด automated):
```bash
kubectl get pods -l app=web -w    # จะเห็น pods เพิ่มเป็น 4
```

**นี่คือหัวใจ GitOps** — ไม่มีใคร `kubectl apply` เอง ทุกการเปลี่ยนแปลงมาจาก Git

---

## Exercise 5 — Self-heal และ Rollback

**Self-heal** — ลองแก้ cluster ตรงๆ (drift) แล้วดู ArgoCD ดึงกลับ:
```bash
kubectl scale deployment/web --replicas=1   # แอบแก้ตรงๆ
# ถ้าเปิด selfHeal ArgoCD จะดึงกลับเป็น 4 ตาม Git
argocd app set web-app --self-heal
```

**Rollback** — ย้อนกลับด้วย Git:
```bash
git revert HEAD --no-edit && git push   # ย้อน commit scale
# ArgoCD sync กลับเป็น 2 replicas
```
หรือใช้ history ของ ArgoCD:
```bash
argocd app history web-app
argocd app rollback web-app <REVISION>
```

---

## Cleanup

```bash
argocd app delete web-app --yes
kubectl delete namespace argocd
minikube stop
```

---

## CI vs CD vs GitOps

```
CI (build/test)          →  GitHub Actions / GitLab / Jenkins
   ↓ push image + update manifest ใน Git
GitOps (deploy/sync)     →  ArgoCD คอย sync Git → cluster
```

ArgoCD ไม่ได้แทน CI — มันรับช่วง **ต่อจาก CI** ในส่วน deploy บน Kubernetes

---

:::tip[สำเร็จแล้ว!]
เข้าใจ GitOps loop ครบแล้ว: แก้ Git → ArgoCD sync → cluster เปลี่ยนตาม + self-heal/rollback ได้
:::

:::note[Challenge]
ต่อ pipeline ให้ครบวง: ให้ **GitHub Actions** (Lab 01) build image แล้ว **commit tag ใหม่กลับเข้า repo manifest** อัตโนมัติ
แล้วให้ ArgoCD sync deploy image ใหม่ — ได้ CI → CD แบบ GitOps เต็มรูปแบบโดยไม่ต้อง `kubectl` เลย
:::
