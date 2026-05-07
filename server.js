const express = require('express');
const RouterOSClient = require('node-routeros').RouterOSClient;
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Environment variables (optional, set in Render dashboard)
const DEFAULT_HOST = process.env.ROUTER_HOST || '';
const DEFAULT_PORT = parseInt(process.env.ROUTER_PORT || '8728');
const DEFAULT_USER = process.env.ROUTER_USER || '';
const DEFAULT_PASS = process.env.ROUTER_PASS || '';

app.post('/api/connect', async (req, res) => {
    const { host, port, username, password } = req.body;
    const useHost = host || DEFAULT_HOST;
    const usePort = port || DEFAULT_PORT;
    const useUser = username || DEFAULT_USER;
    const usePass = password || DEFAULT_PASS;

    if (!useUser || !usePass) {
        return res.status(400).json({ success: false, message: 'Username and password required' });
    }
    if (!useHost) {
        return res.status(400).json({ success: false, message: 'Host required' });
    }

    const client = new RouterOSClient({
        host: useHost,
        port: usePort,
        user: useUser,
        password: usePass,
        timeout: 10000
    });
    try {
        await client.connect();
        const [interfaces, ipAddresses, resources, uptime] = await Promise.all([
            client.write('/interface/print'),
            client.write('/ip/address/print'),
            client.write('/system/resource/print'),
            client.write('/system/uptime/print')
        ]);
        await client.close();
        res.json({ success: true, interfaces, ipAddresses, resources: resources[0], uptime: uptime[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post('/api/command', async (req, res) => {
    const { host, port, username, password, command, params } = req.body;
    const client = new RouterOSClient({
        host: host || DEFAULT_HOST,
        port: port || DEFAULT_PORT,
        user: username || DEFAULT_USER,
        password: password || DEFAULT_PASS
    });
    try {
        await client.connect();
        const result = await client.write(command, params || []);
        await client.close();
        res.json({ success: true, result });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ MikroTik Cloud Proxy running on port ${PORT}`);
});
