// Vercel Serverless Function for OAuth Start
export default async function handler(req, res) {
    // 设置CORS头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { app_id, state } = req.body;

        if (!app_id || !state) {
            return res.status(400).json({ 
                success: false, 
                error: 'Missing app_id or state' 
            });
        }

        // 构建授权URL
        const redirectUri = `${process.env.VERCEL_URL || 'https://your-app.vercel.app'}/api/oauth/callback`;
        const authUrl = `https://open.feishu.cn/open-apis/authen/v1/authorize?app_id=${app_id}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&state=${state}&scope=contact:user.base:readonly docx:document drive:drive`;

        console.log(`Starting OAuth flow for state: ${state}`);
        console.log(`Auth URL: ${authUrl}`);

        return res.status(200).json({
            success: true,
            auth_url: authUrl,
            callback_url: `${process.env.VERCEL_URL || 'https://your-app.vercel.app'}/api/oauth/status/${state}`
        });

    } catch (error) {
        console.error('OAuth start error:', error);
        return res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
}
