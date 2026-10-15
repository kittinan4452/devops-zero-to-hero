// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
	// TODO: เปลี่ยนเป็น URL จริงของคุณ (ชื่อ project บน Cloudflare Pages หรือ custom domain)
	// ค่านี้ใช้สร้าง sitemap + canonical URL — ตั้งให้ตรงกับที่ deploy จริง
	site: 'https://devops-zero-to-hero.kittinan-ku.workers.dev',
	integrations: [
		starlight({
			title: 'DevOps Zero to Hero',
			description: 'เรียน DevOps และ DevSecOps ตั้งแต่เริ่มต้น',
			defaultLocale: 'root',
			locales: {
				root: { label: 'ไทย', lang: 'th' },
			},
			customCss: ['./src/styles/custom.css'],
			// TODO: ใส่ URL repo ของคุณแล้วเปิดใช้ (ปิดไว้ก่อนกันลิงก์เสีย)
			// social: [
			// 	{ icon: 'github', label: 'GitHub', href: 'https://github.com/<username>/<repo>' },
			// ],
			sidebar: [
				{ label: '🛡️ Security', items: [
					{ label: '🗺️ Roadmap - เส้นทางจากศูนย์สู่มือโปร', slug: 'security/roadmap' },
					{ label: 'Level 0 - Foundations (พื้นฐาน)', collapsed: true, items: [
						{ label: 'Concepts', slug: 'security/foundations/concepts' },
						{ label: 'Lab 01 - จัด Lab Environment', slug: 'security/foundations/lab-01' },
					]},
					{ label: 'Level 1 - AppSec (OWASP Top 10)', collapsed: true, items: [
						{ label: 'Concepts', slug: 'security/appsec/concepts' },
						{ label: 'Lab 01 - เจาะ OWASP บน Juice Shop', slug: 'security/appsec/lab-01' },
					]},
					{ label: 'Level 2 - DevSecOps', collapsed: true, items: [
						{ label: 'Concepts', slug: 'devsecops/concepts' },
						{ label: 'Lab 01 - SAST ด้วย Trivy', slug: 'devsecops/lab-01' },
					]},
					{ label: 'Level 3 - Cloud & Container Security', collapsed: true, items: [
						{ label: 'Concepts', slug: 'security/cloud-container/concepts' },
						{ label: 'Lab 01 - Hardening Container + สแกน', slug: 'security/cloud-container/lab-01' },
					]},
					{ label: 'Level 4 - Offensive / Pentest', collapsed: true, items: [
						{ label: 'Concepts', slug: 'security/offensive/concepts' },
						{ label: 'Lab 01 - Recon + Web Exploitation', slug: 'security/offensive/lab-01' },
					]},
					{ label: 'Level 5 - Blue Team / Defense', collapsed: true, items: [
						{ label: 'Concepts', slug: 'security/blueteam/concepts' },
						{ label: 'Lab 01 - Log Monitoring + Brute-Force', slug: 'security/blueteam/lab-01' },
					]},
					{ label: 'Level 6 - เลือกสาย + Certifications', slug: 'security/career' },
				]},
				{ label: '🌐 Network', collapsed: true, items: [
					{ label: '🗺️ Roadmap - จากศูนย์สู่ระดับโปร', slug: 'network/roadmap' },
					{ label: 'Level 0 - Foundations (OSI/TCP-IP)', collapsed: true, items: [
						{ label: 'Concepts', slug: 'network/foundations/concepts' },
						{ label: 'Lab 01 - สำรวจเน็ตเวิร์ก', slug: 'network/foundations/lab-01' },
					]},
					{ label: 'Level 1 - Protocols & Tools', collapsed: true, items: [
						{ label: 'Concepts', slug: 'network/protocols/concepts' },
						{ label: 'Lab 01 - เครื่องมือ Diagnose', slug: 'network/protocols/lab-01' },
					]},
					{ label: 'Level 2 - Subnetting', collapsed: true, items: [
						{ label: 'Concepts', slug: 'network/subnetting/concepts' },
						{ label: 'Lab 01 - คำนวณ Subnet', slug: 'network/subnetting/lab-01' },
					]},
					{ label: 'Level 3 - Routing & Switching', collapsed: true, items: [
						{ label: 'Concepts', slug: 'network/routing-switching/concepts' },
						{ label: 'Lab 01 - Routing Table + NAT', slug: 'network/routing-switching/lab-01' },
					]},
					{ label: 'Level 4 - Linux Networking', collapsed: true, items: [
						{ label: 'Concepts', slug: 'network/linux-networking/concepts' },
						{ label: 'Lab 01 - ip, firewall, tcpdump', slug: 'network/linux-networking/lab-01' },
					]},
					{ label: 'Level 5 - Network Security', collapsed: true, items: [
						{ label: 'Concepts', slug: 'network/security/concepts' },
						{ label: 'Lab 01 - Traffic Analysis + TLS', slug: 'network/security/lab-01' },
					]},
					{ label: 'Level 6 - Cloud & Advanced + Certs', slug: 'network/advanced' },
				]},
				{ label: '⚙️ DevOps', collapsed: true, items: [
					{ label: '🐧 Linux', collapsed: true, items: [
						{ label: 'Basics', slug: 'linux/basics' },
						{ label: '📋 Cheatsheet - คำสั่งที่ใช้บ่อย', slug: 'linux/cheatsheet' },
						{ label: 'Lab 01 - คำสั่งพื้นฐาน', slug: 'linux/lab-01' },
					]},
					{ label: '📜 Logs', collapsed: true, items: [
						{ label: 'Concepts - การอ่าน Log', slug: 'logs/concepts' },
						{ label: '📋 Cheatsheet - คำสั่งอ่าน Log', slug: 'logs/cheatsheet' },
						{ label: 'Lab 01 - สืบสวนเหตุการณ์จาก Log', slug: 'logs/lab-01' },
						{ label: '💻 Log ฝั่ง Dev (Stack Trace)', slug: 'logs/dev' },
						{ label: '🚀 Log ฝั่ง Deploy (CI/CD, K8s)', slug: 'logs/deploy' },
						{ label: '🌐 Log ฝั่ง Network', slug: 'logs/network' },
						{ label: '🛡️ Log ฝั่ง Security', slug: 'logs/security' },
					]},
					{ label: '🐳 Docker', collapsed: true, items: [
						{ label: 'Concepts', slug: 'docker/concepts' },
						{ label: '📋 Cheatsheet - คำสั่งที่ใช้บ่อย', slug: 'docker/cheatsheet' },
						{ label: 'Lab 01 - รัน Container แรก', slug: 'docker/lab-01' },
						{ label: 'Lab 02 - สร้าง Dockerfile', slug: 'docker/lab-02' },
					]},
					{ label: '🦦 Podman', collapsed: true, items: [
						{ label: '📋 Cheatsheet - คำสั่งที่ใช้บ่อย', slug: 'container-tools/cheatsheet' },
						{ label: 'Lab - Podman จริงจัง (Compose + Quadlet)', slug: 'container-tools/lab-02' },
					]},
					{ label: '🖥️ Docker บน Mac/Win', collapsed: true, items: [
						{ label: 'เลือกเครื่องมือไหนดี (เปรียบเทียบ)', slug: 'docker-runtimes/comparison' },
						{ label: 'ติดตั้ง Docker Desktop', slug: 'docker-runtimes/docker-desktop' },
						{ label: 'ติดตั้ง Colima', slug: 'docker-runtimes/colima' },
						{ label: 'ติดตั้ง OrbStack', slug: 'docker-runtimes/orbstack' },
					]},
					{ label: '☸️ Kubernetes', collapsed: true, items: [
						{ label: 'Concepts', slug: 'kubernetes/concepts' },
						{ label: 'Lab 01 - Deploy แรกด้วย kubectl', slug: 'kubernetes/lab-01' },
					]},
					{ label: '🔄 CI/CD', collapsed: true, items: [
						{ label: 'Concepts', slug: 'cicd/concepts' },
						{ label: 'Lab 01 - GitHub Actions', slug: 'cicd/lab-01' },
						{ label: 'Lab 02 - GitLab CI/CD', slug: 'cicd/lab-02' },
						{ label: 'Lab 03 - Jenkins Pipeline', slug: 'cicd/lab-03' },
						{ label: 'Lab 04 - ArgoCD (GitOps)', slug: 'cicd/lab-04' },
					]},
					{ label: '🏗️ Terraform', collapsed: true, items: [
						{ label: 'Concepts', slug: 'terraform/concepts' },
						{ label: 'Lab 01 - Infrastructure as Code', slug: 'terraform/lab-01' },
					]},
					{ label: '⚙️ Ansible', collapsed: true, items: [
						{ label: 'Concepts', slug: 'ansible/concepts' },
						{ label: 'Lab 01 - Automate Server Setup', slug: 'ansible/lab-01' },
					]},
					{ label: '📊 Monitoring', collapsed: true, items: [
						{ label: 'Concepts', slug: 'monitoring/concepts' },
						{ label: 'Lab 01 - Prometheus + Grafana Stack', slug: 'monitoring/lab-01' },
					]},
					{ label: '🔒 DevSecOps', collapsed: true, items: [
						{ label: 'Concepts', slug: 'devsecops/concepts' },
						{ label: 'Lab 01 - SAST ด้วย Trivy', slug: 'devsecops/lab-01' },
					]},
				]},
			],
		}),
	],

  adapter: cloudflare(),
});