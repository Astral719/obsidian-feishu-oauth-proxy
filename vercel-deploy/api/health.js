// Vercel Serverless Function for Health Check
export default async function handler(req, res) {
    // 设置CORS头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const healthData = {
            status: 'ok',
            message: '飞书分享代理服务器运行正常',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            version: '1.0.0',
            endpoints: {
                oauth_start: '/api/oauth/start',
                oauth_callback: '/api/oauth/callback',
                oauth_status: '/api/oauth/status/{state}',
                proxy: '/api/proxy'
            },
            environment: {
                node_version: process.version,
                platform: process.platform,
                memory_usage: process.memoryUsage()
            }
        };

        return res.status(200).json(healthData);

    } catch (error) {
        console.error('Health check error:', error);
        return res.status(500).json({
            status: 'error',
            message: '服务器内部错误',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
}
