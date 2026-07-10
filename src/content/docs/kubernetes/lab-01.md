---
title: "Lab 01 - Deploy แรกด้วย kubectl"
---

## เป้าหมาย

- ติดตั้ง Minikube และ kubectl
- Deploy application แรกบน Kubernetes
- Scale และ update deployment

## สิ่งที่ต้องมี


:::note[Requirements]
ติดตั้ง Minikube: [minikube.sigs.k8s.io](https://minikube.sigs.k8s.io/docs/start/)
```bash
minikube version
kubectl version --client
```
:::

---

## Exercise 1 — เริ่ม Cluster

```bash
# Start minikube
minikube start

# ตรวจสอบ
kubectl cluster-info
kubectl get nodes

# ควรเห็น node status: Ready
```

---

## Exercise 2 — Deploy Nginx

สร้าง `nginx-deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx
  labels:
    app: nginx
spec:
  replicas: 2
  selector:
    matchLabels:
      app: nginx
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - name: nginx
        image: nginx:1.25
        ports:
        - containerPort: 80
        resources:
          requests:
            memory: "64Mi"
            cpu: "100m"
          limits:
            memory: "128Mi"
            cpu: "200m"
---
apiVersion: v1
kind: Service
metadata:
  name: nginx-service
spec:
  selector:
    app: nginx
  ports:
  - port: 80
    targetPort: 80
  type: NodePort
```

```bash
kubectl apply -f nginx-deployment.yaml

# ดู status
kubectl get deployments
kubectl get pods
kubectl get services

# เข้าถึง service
minikube service nginx-service --url
# จะได้ URL เช่น http://192.168.49.2:32000
curl <URL>
```

---

## Exercise 3 — Scale Deployment

```bash
# Scale ขึ้นเป็น 5 replicas
kubectl scale deployment nginx --replicas=5
kubectl get pods  # ดู pods เพิ่มขึ้น

# Scale ลง
kubectl scale deployment nginx --replicas=2
kubectl get pods -w  # watch pods ถูกลบ (Ctrl+C เพื่อออก)
```

---

## Exercise 4 — Rolling Update

```bash
# Update image version
kubectl set image deployment/nginx nginx=nginx:1.26

# ดู rolling update progress
kubectl rollout status deployment/nginx

# ดู history
kubectl rollout history deployment/nginx

# Rollback ถ้ามีปัญหา
kubectl rollout undo deployment/nginx
kubectl rollout status deployment/nginx
```

---

## Exercise 5 — ConfigMap & Environment Variables

สร้าง `configmap.yaml`:
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  WELCOME_MSG: "Hello from Kubernetes!"
  LOG_LEVEL: "info"
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app-with-config
spec:
  replicas: 1
  selector:
    matchLabels:
      app: app-with-config
  template:
    metadata:
      labels:
        app: app-with-config
    spec:
      containers:
      - name: app
        image: nginx:latest
        envFrom:
        - configMapRef:
            name: app-config
```

```bash
kubectl apply -f configmap.yaml

# ตรวจสอบ env var ใน pod
POD=$(kubectl get pod -l app=app-with-config -o jsonpath='{.items[0].metadata.name}')
kubectl exec $POD -- env | grep -E "WELCOME|LOG"
```

---

## Cleanup

```bash
kubectl delete -f nginx-deployment.yaml
kubectl delete -f configmap.yaml
minikube stop  # หยุด cluster (เก็บ state ไว้)
# minikube delete  # ลบ cluster ทิ้งเลย
```

---


:::tip[สำเร็จแล้ว!]
คุณ deploy, scale, และ update บน Kubernetes ได้แล้ว
:::


:::note[Challenge]
สร้าง Deployment สำหรับ **PostgreSQL** พร้อม:
- Secret สำหรับเก็บ password
- PersistentVolumeClaim สำหรับ data
- Service แบบ ClusterIP
:::
