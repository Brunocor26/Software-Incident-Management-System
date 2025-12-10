# 📋 Incident Manager – Frontend

> Lightweight, responsive web app for creating, viewing and tracking IT incidents.  
> Built with **vanilla HTML / CSS / JS** – no frameworks, no build step.

---

## 🧩 What’s inside

| File                 | Purpose                                          |
| -------------------- | ------------------------------------------------ |
| `incidents.html`     | List all incidents (filterable / searchable)     |
| `view_incident.html` | Detail page → edit fields + attach files         |
| `new_incident.html`  | Create new incident                              |
| `incidents.css`      | Single stylesheet (light + dark mode)            |
| `*.js`               | Plain ES-modules – swap for API calls when ready |

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

| View            | Link                                                                      |
| --------------- | ------------------------------------------------------------------------- |
| Product backlog | https://bafc2.atlassian.net/jira/software/projects/SCRUM/boards/1/backlog |
| Active board    | https://your-team.atlassian.net/jira/software/projects/IM/boards/1        |
| Current sprint  | Sprint 4                                                                  |

### Definition of Done (DoD)

1. Code reviewed & approved in GitHub PR
2. Jira issue moved to **“In Review”** → linked PR
3. GitHub Actions CI green (lint + unit tests)
4. Rebased on `main` & squash-merged
5. Issue transitioned to **“Done”** by reviewer

---

## 👥 Team composition for sprint 4

- **Product Owner** – Bruno Correia
- **Scrum Master** – Vasco Colaço
- **Devs** – Daniel Basílio & Alexandre Santos & Henrique Laia

---

## 📄 Licence

UBI © 2025

---

> Sprint reviews & retros every week! – reach out if you have any suggestions!

---

## 🧪 Testing

This project uses **Playwright** for end-to-end testing.

### Prerequisites

- Node.js installed
- Dependencies installed (`npm install`)
- Playwright browsers installed (`npx playwright install`)

### Running Tests

To run the tests, you need to have both the backend and frontend servers running.

1. **Start Backend**:

   ```bash
   cd backend
   node server.js
   ```

2. **Start Frontend** (in a separate terminal):

   ```bash
   npx http-server frontend/public -p 8080
   ```

3. **Run Tests** (in a separate terminal):
   ```bash
   npx playwright test
   ```

### Test Reports

After running the tests, a report is generated. You can view it by running:

```bash
npx playwright show-report

```

## 🚀 Non-Functional Requirements (RNFs)

The system adheres to the following non-functional requirements:

- **RNF1**: The system must be fast, with a response time of less than 3 seconds.
- **RNF2**: The interface must be intuitive and minimize the number of mandatory fields.
- **RNF3**: The system must use secure authentication and data encryption.
- **RNF4**: The system must be accessible via web browsers (Chrome, Firefox, Microsoft Edge, Safari) and compatible with mobile devices.
- **RNF6**: The interface must follow good usability practices and intuitive design.
