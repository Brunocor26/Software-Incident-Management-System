const { Router } = require("express");
const { exec } = require("child_process");
const r = Router();

/* 
  POST /branch
  Cria um novo ramo git no servidor.
*/
r.post("/branch", (req, res) => {
    const { branchName, repoPath } = req.body;

    // Validação básica para evitar injeções (apenas alfanuméricos, traços e barras)
    if (!branchName || !/^[a-zA-Z0-9\-\/]+$/.test(branchName)) {
        return res.status(400).json({ error: "Invalid branch name" });
    }

    const command = `git checkout -b ${branchName}`;
    const options = repoPath ? { cwd: repoPath } : {}; // Se foi dado um caminho, executa lá

    console.log(`[Git] Executing: ${command} in ${repoPath || "default cwd"}`);

    exec(command, options, (error, stdout, stderr) => {
        if (error) {
            console.error(`[Git] Error: ${stderr}`);
            // Verificar se o ramo já existe
            if (stderr.includes("already exists")) {
                return res.status(409).json({ error: "Branch already exists" });
            }
            return res.status(500).json({ error: "Failed to create branch", details: stderr });
        }

        console.log(`[Git] Success: ${stdout}`);
        res.json({ message: "Branch created successfully", result: stdout || stderr });
    });
});

module.exports = r;
