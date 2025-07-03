// Using built-in fetch in Node.js 18+

async function testMasteryTranscript() {
    const baseUrl = 'http://localhost:5000/api';
    
    try {
        // Step 1: Login as admin to get a token (since users endpoint requires admin)
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
            console.error('❌ Login failed:', loginResponse.status, loginResponse.statusText);
            const errorText = await loginResponse.text();
            console.error('Error details:', errorText);
            return;
        }
        
        const loginData = await loginResponse.json();
        console.log('✅ Login successful:', loginData.user.email, 'Role:', loginData.user.role);
        
        const token = loginData.token;
        
        // Step 2: Get all users to find students
        console.log('\n📚 Fetching users...');
        const usersResponse = await fetch(`${baseUrl}/users`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!usersResponse.ok) {
            console.error('❌ Failed to fetch users:', usersResponse.status);
            return;
        }
        
        const usersData = await usersResponse.json();
        const users = usersData.data;
        const students = users.filter(user => user.role === 'STUDENT');
        console.log('✅ Found', students.length, 'students out of', users.length, 'total users');
        
        if (students.length === 0) {
            console.error('❌ No students found in database');
            return;
        }
        
        // Use the first student
        const student = students[0];
        console.log('📋 Testing with student:', student.name, '(ID:', student.id + ')');
        
        // Step 3: Test mastery transcript endpoint
        console.log('\n📊 Fetching mastery transcript...');
        const transcriptResponse = await fetch(`${baseUrl}/reports/student/${student.id}/mastery-transcript`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!transcriptResponse.ok) {
            console.error('❌ Mastery transcript request failed:', transcriptResponse.status, transcriptResponse.statusText);
            const errorText = await transcriptResponse.text();
            console.error('Error details:', errorText);
            return;
        }
        
        const transcriptData = await transcriptResponse.json();
        console.log('✅ Mastery transcript fetched successfully!');
        console.log('📋 Transcript data:');
        console.log(JSON.stringify(transcriptData, null, 2));
        
        // Step 4: Test frontend access
        console.log('\n🌐 Testing frontend...');
        console.log('Frontend should be accessible at: http://localhost:5173');
        console.log('Try logging in with:');
        console.log('  Email: admin@demo.com');
        console.log('  Password: password');
        console.log(`Navigate to Profile → Mastery Transcript for student: ${student.name}`);
        
    } catch (error) {
        console.error('❌ Test failed with error:', error.message);
    }
}

testMasteryTranscript();
