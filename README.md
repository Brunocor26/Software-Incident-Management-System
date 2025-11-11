# 📋 Incident Manager – Frontend  
> Lightweight, responsive web app for creating, viewing and tracking IT incidents.  
Built with **vanilla HTML / CSS / JS** – no frameworks, no build step.

---

## 🧩 What’s inside
| File | Purpose |
|------|---------|
| `incidents.html` | List all incidents (filterable / searchable) |
| `view_incident.html` | Detail page → edit fields + attach files |
| `new_incident.html` | Create new incident |
| `incidents.css` | Single stylesheet (light + dark mode) |
| `*.js` | Plain ES-modules – swap for API calls when ready |

---

## 🎨 Features
✅ Responsive table → cards on mobile  
✅ Dark / light mode (respects `prefers-color-scheme`)  
✅ Live search & filters (priority, category, status)  
✅ Rich status pills + priority icons (colour-blind friendly)  
✅ Attach / preview / remove files (drag-&-drop)  
✅ Edit-in-place on detail page  

---

## 🔌 Jira workflow (how we use it)
We track **user stories**, **problems** and **tasks** in **[Jira Software](https://your-team.atlassian.net)**.

### Board quick links
| View | Link |
|------|------|
| Product backlog | https://bafc2.atlassian.net/jira/software/projects/SCRUM/boards/1/backlog |
| Active board | https://your-team.atlassian.net/jira/software/projects/IM/boards/1 |
|Current sprint | Sprint 3 |

### Definition of Done (DoD)
1. Code reviewed & approved in GitHub PR  
2. Jira issue moved to **“In Review”** → linked PR  
3. GitHub Actions CI green (lint + unit tests)  
4. Rebased on `main` & squash-merged  
5. Issue transitioned to **“Done”** by reviewer  

---

## 👥 Team composition for sprint 3
* **Product Owner** – Daniel Basílio
* **Scrum Master** – Alexandre Leitão
* **Devs** – Bruno Correia & Vasco Colaço & Henrique Laia  

---

## 📄 Licence
UBI © 2025

---

> Sprint reviews & retros every week! – reach out if you have any suggestions!