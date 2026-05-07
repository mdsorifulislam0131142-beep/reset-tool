const express = require('express');
const RouterOSClient = require('node-routeros').RouterOSClient;
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// আপনার রাউটারের তথ্য (সুরক্ষিত রাখতে Environment Variable ব্যবহার করুন)
const ROUTER_HOST = process.env.ROUTER_HOST || 'd15b0d8af4f4.sn.mynetname.net';
const ROUTER_PORT = parseInt(process.env.ROUTER_PORT || '8728');
const ROUTER_USER = process.env.ROUTER_USER || 'admin';
const ROUTER_PASS = process.env.ROUTER_PASS || 'your_password';

// API এন্ডপয়েন্ট
app.post('/api/connect', async (req, res) => {
    const { host, port, username, password } = req.body;
    const useHost = host || ROUTER_HOST;
    const usePort = port || ROUTER_PORT;
    const useUser = username || ROUTER_USER;
    const usePass = password || ROUTER_PASS;

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
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post('/api/command', async (req, res) => {
    const { host, port, username, password, command, params } = req.body;
    const client = new RouterOSClient({ host: host || ROUTER_HOST, port: port || ROUTER_PORT, user: username || ROUTER_USER, password: password || ROUTER_PASS });
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
app.listen(PORT, () => console.log(`✅ API running on port ${PORT}`));
