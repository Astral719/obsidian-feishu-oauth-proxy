#!/usr/bin/env node

/**
 * 部署后测试脚本
 * 用于验证 Vercel 部署的服务是否正常工作
 */

const https = require('https');
const http = require('http');

// 配置
const BASE_URL = process.argv[2] || 'https://obsidian-feishu-oauth.vercel.app';

console.log('🧪 开始测试部署的服务...');
console.log(`📍 测试地址: ${BASE_URL}`);
console.log('');

// 测试用例
const tests = [
    {
        name: '健康检查',
        path: '/api/health',
        method: 'GET',
        expectedStatus: 200
    },
    {
        name: 'OAuth 启动 (OPTIONS)',
        path: '/api/oauth/start',
        method: 'OPTIONS',
        expectedStatus: 200
    },
    {
        name: 'OAuth 启动 (无参数)',
        path: '/api/oauth/start',
        method: 'POST',
        expectedStatus: 400,
        body: JSON.stringify({})
    },
    {
        name: 'OAuth 状态查询',
        path: '/api/oauth/status/test-state',
        method: 'GET',
        expectedStatus: 200
    },
    {
        name: 'API 代理 (OPTIONS)',
        path: '/api/proxy',
        method: 'OPTIONS',
        expectedStatus: 200
    },
    {
        name: 'API 代理 (无参数)',
        path: '/api/proxy',
        method: 'POST',
        expectedStatus: 400,
        body: JSON.stringify({})
    }
];

// 执行 HTTP 请求
function makeRequest(url, options) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https:') ? https : http;
        
        const req = protocol.request(url, options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    body: data
                });
            });
        });

        req.on('error', reject);
        
        if (options.body) {
            req.write(options.body);
        }
        
        req.end();
    });
}

// 运行单个测试
async function runTest(test) {
    try {
        const url = `${BASE_URL}${test.path}`;
        const options = {
            method: test.method,
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Deployment-Test/1.0.0'
            }
        };

        if (test.body) {
            options.body = test.body;
        }

        const response = await makeRequest(url, options);
        
        const passed = response.statusCode === test.expectedStatus;
        const status = passed ? '✅' : '❌';
        
        console.log(`${status} ${test.name}`);
        console.log(`   请求: ${test.method} ${test.path}`);
        console.log(`   期望状态: ${test.expectedStatus}, 实际状态: ${response.statusCode}`);
        
        if (!passed) {
            console.log(`   响应体: ${response.body.substring(0, 200)}...`);
        }
        
        console.log('');
        
        return passed;
    } catch (error) {
        console.log(`❌ ${test.name}`);
        console.log(`   错误: ${error.message}`);
        console.log('');
        return false;
    }
}

// 运行所有测试
async function runAllTests() {
    let passed = 0;
    let total = tests.length;
    
    for (const test of tests) {
        const result = await runTest(test);
        if (result) passed++;
    }
    
    console.log('📊 测试结果:');
    console.log(`   通过: ${passed}/${total}`);
    console.log(`   成功率: ${Math.round(passed / total * 100)}%`);
    
    if (passed === total) {
        console.log('');
        console.log('🎉 所有测试通过！服务部署成功！');
        console.log('');
        console.log('📋 接下来的步骤:');
        console.log('1. 在 Vercel Dashboard 中配置 KV 数据库');
        console.log('2. 设置环境变量 KV_REST_API_URL 和 KV_REST_API_TOKEN');
        console.log('3. 在飞书开放平台中设置回调地址');
        console.log('4. 在 Obsidian 插件中配置代理地址');
        process.exit(0);
    } else {
        console.log('');
        console.log('⚠️  部分测试失败，请检查部署配置');
        process.exit(1);
    }
}

// 开始测试
runAllTests().catch(error => {
    console.error('❌ 测试执行失败:', error);
    process.exit(1);
});
