const express = require('express');
const router = express.Router();
const simpleGit = require('simple-git');
const path = require('path');
const { Incident } = require('../models/incidentModel');
const authenticateToken = require('../middleware/authMiddleware');

// Initialize simple-git with the repo path from env or default to parent directory of backend
const REPO_PATH = process.env.GIT_REPO_PATH || path.resolve(__dirname, '../../');
const git = simpleGit(REPO_PATH);

// Helper to check if it's a git repo
const isGitRepo = async () => {
    try {
        return await git.checkIsRepo();
    } catch (e) {
        return false;
    }
};

// POST /api/git/create-branch
router.post('/create-branch', authenticateToken, async (req, res) => {
    const { incidentId, branchName, baseBranch = 'main' } = req.body;

    if (!incidentId || !branchName) {
        return res.status(400).json({ error: 'Incident ID and Branch Name are required' });
    }

    try {
        if (!await isGitRepo()) {
            return res.status(500).json({ error: 'Server is not running in a valid Git repository' });
        }

        const incident = await Incident.findById(incidentId);
        if (!incident) {
            return res.status(404).json({ error: 'Incident not found' });
        }

        if (incident.gitBranch) {
            return res.status(400).json({ error: `Incident already has a linked branch: ${incident.gitBranch}` });
        }

        // NOTE: User requested MANUAL workflow only. 
        // We do NOT create the branch on the server.
        // We ONLY link the branch name to the incident.

        // Update Incident with branch name
        incident.gitBranch = branchName;
        // Add timeline entry
        incident.timeline.push({
            at: new Date(),
            by: req.user._id,
            action: 'git_branch_linked',
            note: `Linked branch ${branchName}`
        });
        await incident.save();

        res.json({ message: `Branch ${branchName} linked successfully`, branchName });

    } catch (error) {
        console.error('Operation failed:', error);
        res.status(500).json({ error: `Operation failed: ${error.message}` });
    }
});

// GET /api/git/status
router.get('/status', authenticateToken, async (req, res) => {
    try {
        if (!await isGitRepo()) {
            return res.json({ isRepo: false });
        }
        const status = await git.status();
        res.json({ isRepo: true, ...status });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
