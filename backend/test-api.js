import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000/api';

async function testAPI() {
    console.log('🧪 Testing CBLMS Backend API\n');

    try {
        // Test health endpoint
        console.log('1. Testing health endpoint...');
        const healthResponse = await fetch(`${BASE_URL}/health`);
        const healthData = await healthResponse.json();
        console.log('✅ Health check:', healthData.message, '\n');

        // Test login
        console.log('2. Testing teacher login...');
        const loginResponse = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'teacher@demo.com',
                password: 'password'
            })
        });
        
        const loginData = await loginResponse.json();
        if (loginData.success) {
            console.log('✅ Teacher login successful');
            const token = loginData.token;
            
            // Test getting classes
            console.log('3. Testing get classes...');
            const classesResponse = await fetch(`${BASE_URL}/classes`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const classesData = await classesResponse.json();
            if (classesData.success) {
                console.log('✅ Classes retrieved:', classesData.data.length, 'classes found');
            }
            
            // Test getting users
            console.log('4. Testing get users...');
            const usersResponse = await fetch(`${BASE_URL}/users`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const usersData = await usersResponse.json();
            if (usersData.success) {
                console.log('✅ Users retrieved:', usersData.data.length, 'users found');
            }
            
        } else {
            console.log('❌ Teacher login failed:', loginData.message);
        }

        // Test student login
        console.log('\n5. Testing student login...');
        const studentLoginResponse = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'student@demo.com',
                password: 'password'
            })
        });
        
        const studentLoginData = await studentLoginResponse.json();
        if (studentLoginData.success) {
            console.log('✅ Student login successful');
            const studentToken = studentLoginData.token;
            
            // Test getting competency status
            console.log('6. Testing competency status...');
            const competencyResponse = await fetch(`${BASE_URL}/competencies/status`, {
                headers: { 'Authorization': `Bearer ${studentToken}` }
            });
            const competencyData = await competencyResponse.json();
            if (competencyData.success) {
                console.log('✅ Competency status retrieved:', competencyData.data);
            }
            
        } else {
            console.log('❌ Student login failed:', studentLoginData.message);
        }

        console.log('\n🎉 API testing completed!');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testAPI();
