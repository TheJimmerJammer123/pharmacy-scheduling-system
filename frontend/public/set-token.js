// Auto-login script for pharmacy scheduling system
// This automatically authenticates the user and stores the token

(async function autoLogin() {
  try {
    console.log('🔐 Auto-login: Starting authentication...');
    
    // Check if already authenticated
    const existingToken = localStorage.getItem('authToken');
    if (existingToken) {
      console.log('✅ Already authenticated with existing token');
      return;
    }
    
    // Login with admin credentials
    const loginResponse = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin'
      })
    });

    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status}`);
    }

    const loginData = await loginResponse.json();
    
    if (loginData.success && loginData.token) {
      // Store the token in localStorage
      localStorage.setItem('authToken', loginData.token);
      console.log('✅ Auto-login successful!');
      console.log('   User:', loginData.user.username);
      console.log('   Role:', loginData.user.role);
      
      // Show success message
      const message = document.createElement('div');
      message.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #10b981;
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        font-family: Arial, sans-serif;
        font-size: 14px;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      `;
      message.textContent = `✅ Logged in as ${loginData.user.username}`;
      document.body.appendChild(message);
      
      // Remove message after 3 seconds
      setTimeout(() => {
        if (document.body.contains(message)) {
          document.body.removeChild(message);
        }
      }, 3000);
    } else {
      throw new Error('Invalid login response');
    }
  } catch (error) {
    console.error('❌ Auto-login failed:', error);
    
    // Show error message  
    const message = document.createElement('div');
    message.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #ef4444;
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      font-family: Arial, sans-serif;
      font-size: 14px;
      z-index: 10000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    message.textContent = `❌ Auto-login failed: ${error.message}`;
    document.body.appendChild(message);
    
    setTimeout(() => {
      if (document.body.contains(message)) {
        document.body.removeChild(message);
      }
    }, 5000);
  }
})();
