// Vercel Serverless Function for OAuth Status Check
// 使用共享的内存存储

// 注意：这是一个简化的解决方案
// 在生产环境中，不同的Serverless函数实例可能无法共享内存
// 但对于OAuth这种短暂的流程，通常可以工作

// 尝试从全局对象获取存储，如果不存在则创建
if (!global.oauthResults) {
    global.oauthResults = new Map();
}

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

        console.log(`Checking OAuth status for state: ${state}`);
        console.log(`Available states: ${Array.from(global.oauthResults.keys()).join(', ')}`);

        // 从内存存储中获取OAuth结果
        const result = global.oauthResults.get(`oauth:${state}`);

        if (!result) {
            // 还没有结果，继续等待
            return res.status(200).json({
                success: false,
                pending: true,
                message: 'Waiting for authorization...'
            });
        }

        // 检查是否过期（5分钟）
        const now = Date.now();
        if (now - result.timestamp > 5 * 60 * 1000) {
            global.oauthResults.delete(`oauth:${state}`);
            return res.status(200).json({
                success: false,
                error: 'Authorization expired, please try again'
            });
        }

        // 返回结果并清理
        global.oauthResults.delete(`oauth:${state}`);
        return res.status(200).json(result);

    } catch (error) {
        console.error('OAuth status check error:', error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
}
