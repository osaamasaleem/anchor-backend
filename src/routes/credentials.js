// Example Node.js/Express Backend Route Endpoint
router.get('/api/credentials/proof/:ipfsHash', async (req, res) => {
    try {
        const credentialLog = await db.collection('credentials').findOne({ ipfsHash: req.params.ipfsHash });
        if (!credentialLog) {
            return res.status(404).json({ message: "Proof index not found" });
        }
        res.json({ blockchainTx: credentialLog.blockchainTx });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});