// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

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
				{ label: '🐧 Linux', items: [
					{ label: 'Basics', slug: 'linux/basics' },
					{ label: '📋 Cheatsheet - คำสั่งที่ใช้บ่อย', slug: 'linux/cheatsheet' },
					{ label: 'Lab 01 - คำสั่งพื้นฐาน', slug: 'linux/lab-01' },
				]},
				{ label: '🐳 Docker', items: [
					{ label: 'Concepts', slug: 'docker/concepts' },
					{ label: '📋 Cheatsheet - คำสั่งที่ใช้บ่อย', slug: 'docker/cheatsheet' },
					{ label: 'Lab 01 - รัน Container แรก', slug: 'docker/lab-01' },
					{ label: 'Lab 02 - สร้าง Dockerfile', slug: 'docker/lab-02' },
				]},
				{ label: '🦦 Podman', items: [
					{ label: '📋 Cheatsheet - คำสั่งที่ใช้บ่อย', slug: 'container-tools/cheatsheet' },
					{ label: 'Lab - Podman จริงจัง (Compose + Quadlet)', slug: 'container-tools/lab-02' },
				]},
				{ label: '🖥️ Docker บน Mac/Win', items: [
					{ label: 'เลือกเครื่องมือไหนดี (เปรียบเทียบ)', slug: 'docker-runtimes/comparison' },
					{ label: 'ติดตั้ง Docker Desktop', slug: 'docker-runtimes/docker-desktop' },
					{ label: 'ติดตั้ง Colima', slug: 'docker-runtimes/colima' },
					{ label: 'ติดตั้ง OrbStack', slug: 'docker-runtimes/orbstack' },
				]},
				{ label: '☸️ Kubernetes', items: [
					{ label: 'Concepts', slug: 'kubernetes/concepts' },
					{ label: 'Lab 01 - Deploy แรกด้วย kubectl', slug: 'kubernetes/lab-01' },
				]},
				{ label: '🔄 CI/CD', items: [
					{ label: 'Concepts', slug: 'cicd/concepts' },
					{ label: 'Lab 01 - GitHub Actions', slug: 'cicd/lab-01' },
					{ label: 'Lab 02 - GitLab CI/CD', slug: 'cicd/lab-02' },
					{ label: 'Lab 03 - Jenkins Pipeline', slug: 'cicd/lab-03' },
					{ label: 'Lab 04 - ArgoCD (GitOps)', slug: 'cicd/lab-04' },
				]},
				{ label: '🏗️ Terraform', items: [
					{ label: 'Concepts', slug: 'terraform/concepts' },
					{ label: 'Lab 01 - Infrastructure as Code', slug: 'terraform/lab-01' },
				]},
				{ label: '⚙️ Ansible', items: [
					{ label: 'Concepts', slug: 'ansible/concepts' },
					{ label: 'Lab 01 - Automate Server Setup', slug: 'ansible/lab-01' },
				]},
				{ label: '📊 Monitoring', items: [
					{ label: 'Concepts', slug: 'monitoring/concepts' },
					{ label: 'Lab 01 - Prometheus + Grafana Stack', slug: 'monitoring/lab-01' },
				]},
				{ label: '🔒 DevSecOps', items: [
					{ label: 'Concepts', slug: 'devsecops/concepts' },
					{ label: 'Lab 01 - SAST ด้วย Trivy', slug: 'devsecops/lab-01' },
				]},
			],
		}),
	],
});
