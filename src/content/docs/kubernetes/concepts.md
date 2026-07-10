---
title: "Kubernetes Concepts"
---

Kubernetes (K8s) คือ container orchestration platform สำหรับ deploy, scale, และจัดการ container อัตโนมัติ

---

## Architecture

```
┌─────────────────────────────────────────────┐
│              Control Plane                  │
│  ┌──────────┐  ┌─────────┐  ┌───────────┐  │
│  │API Server│  │Scheduler│  │Controller │  │
│  └──────────┘  └─────────┘  │ Manager   │  │
│  ┌──────────┐               └───────────┘  │
│  │  etcd    │  (cluster state storage)      │
│  └──────────┘                               │
└─────────────────────────────────────────────┘
         ↕
┌──────────────┐  ┌──────────────┐
│   Worker 1   │  │   Worker 2   │
│  ┌────────┐  │  │  ┌────────┐  │
│  │ Pod    │  │  │  │ Pod    │  │
│  │ Pod    │  │  │  │ Pod    │  │
│  └────────┘  │  │  └────────┘  │
│  kubelet     │  │  kubelet     │
└──────────────┘  └──────────────┘
```

---

## Objects หลัก

### Pod
unit เล็กสุดใน K8s — group ของ containers ที่รันด้วยกัน

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: my-pod
spec:
  containers:
  - name: nginx
    image: nginx:latest
    ports:
    - containerPort: 80
```

### Deployment
จัดการ Pod replicas และ rolling updates

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: my-app
  template:
    metadata:
      labels:
        app: my-app
    spec:
      containers:
      - name: app
        image: myapp:1.0
        ports:
        - containerPort: 8000
```

### Service
expose Pods ให้เข้าถึงได้ (load balancing)

```yaml
apiVersion: v1
kind: Service
metadata:
  name: my-service
spec:
  selector:
    app: my-app
  ports:
  - port: 80
    targetPort: 8000
  type: ClusterIP  # หรือ NodePort, LoadBalancer
```

### ConfigMap & Secret

```yaml
# ConfigMap สำหรับ config ทั่วไป
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  APP_ENV: production
  LOG_LEVEL: info

---
# Secret สำหรับข้อมูลสำคัญ (base64 encoded)
apiVersion: v1
kind: Secret
metadata:
  name: app-secret
type: Opaque
data:
  DB_PASSWORD: c2VjcmV0MTIz  # base64: secret123
```

---

## คำสั่ง kubectl

```bash
# Cluster info
kubectl cluster-info
kubectl get nodes

# Deploy
kubectl apply -f deployment.yaml
kubectl get deployments
kubectl get pods
kubectl get services

# Debug
kubectl describe pod <pod-name>
kubectl logs <pod-name>
kubectl logs -f <pod-name>          # follow logs
kubectl exec -it <pod-name> -- bash # เข้าไปใน pod

# Scale
kubectl scale deployment my-app --replicas=5

# Update image (rolling update)
kubectl set image deployment/my-app app=myapp:2.0

# Rollback
kubectl rollout undo deployment/my-app

# Delete
kubectl delete -f deployment.yaml
kubectl delete pod <pod-name>
```

---

## Namespace

แบ่ง cluster ออกเป็น virtual cluster:

```bash
kubectl create namespace staging
kubectl get pods -n staging
kubectl apply -f app.yaml -n staging
```

---


:::tip[เครื่องมือที่แนะนำ]
- **Minikube** — K8s บน local machine
- **k9s** — TUI สำหรับดู cluster แบบ interactive
- **Lens** — GUI K8s IDE
- **Helm** — package manager สำหรับ K8s
:::


:::tip[พร้อมแล้ว?]
ไปทำ [Lab 01 - Deploy แรกด้วย kubectl](/kubernetes/lab-01)
:::
