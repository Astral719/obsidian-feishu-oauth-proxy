// Vercel Serverless Function for OAuth Status Check
import { kv } from '@vercel/kv';

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
        const { state } = req.query;

        if (!state) {
            return res.status(400).json({ 
                success: false, 
                error: 'Missing state parameter' 
            });
        }

        // 从KV存储中获取OAuth结果
        const result = await kv.get(`oauth:${state}`);

        if (!result) {
            // 还没有结果，继续等待
            return res.status(200).json({
                success: false,
                pending: true,
                message: 'Waiting for authorization...'
            });
        }

        // 返回结果
        return res.status(200).json(result);

    } catch (error) {
        console.error('OAuth status check error:', error);
        return res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
}
