// Using built-in fetch in Node.js 18+

async function testEndpoints() {
    const baseUrl = 'http://localhost:5000/api';
    
    try {
        // Step 1: Login as admin to get a token
        console.log('🔐 Logging in as admin...');
        const loginResponse = await fetch(`${baseUrl}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'admin@demo.com',
                password: 'password'
            })
        });
        
        if (!loginResponse.ok) {
            console.error('❌ Login failed:', loginResponse.status);
            return;
        }
        
        const loginData = await loginResponse.json();
        const token = loginData.token;
        console.log('✅ Login successful');
        
        // Test different endpoint variations
        const endpoints = [
            '/reports/student/3/mastery-transcript',
            '/reports/student/3/progress',
            '/users',
            '/classes'
        ];
        
        for (const endpoint of endpoints) {
            console.log(`\n🔍 Testing endpoint: ${endpoint}`);
            try {
                const response = await fetch(`${baseUrl}${endpoint}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                console.log(`   Status: ${response.status} ${response.statusText}`);
                
                if (response.status === 404) {
                    const errorText = await response.text();
                    console.log(`   Error: ${errorText}`);
                } else if (response.ok) {
                    console.log(`   ✅ Success!`);
                } else {
                    const errorText = await response.text();
                    console.log(`   Error (${response.status}): ${errorText}`);
                }
                
            } catch (error) {
                console.log(`   ❌ Network error: ${error.message}`);
            }
        }
        
    } catch (error) {
        console.error('❌ Test failed with error:', error.message);
    }
}

testEndpoints();
