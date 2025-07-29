#!/usr/bin/env python3
"""
Test script for password reset functionality
"""

import requests
import json
import sys

# Configuration
API_BASE_URL = "http://localhost:5000/api"  # Change this to your API URL
TEST_EMAIL = "test@example.com"  # Change this to a test user email
NEW_PASSWORD = "newpassword123"

def test_password_reset():
    """Test the complete password reset flow"""
    print("🧪 Testing Password Reset Functionality\n")
    
    # Test 1: Full password reset test
    print("1️⃣ Testing complete password reset flow...")
    try:
        response = requests.post(f"{API_BASE_URL}/debug/full-password-reset-test", 
                               json={
                                   "email": TEST_EMAIL,
                                   "new_password": NEW_PASSWORD
                               })
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Full test passed: {data['success']}")
            
            print("\n📋 Test Steps:")
            for step in data['test_steps']:
                status = "✅" if step['success'] else "❌"
                print(f"   {status} Step {step['step']}: {step['description']}")
                if not step['success']:
                    print(f"      Data: {step['data']}")
            
            print(f"\n🎯 Final Status:")
            final = data['final_status']
            print(f"   Email: {final['user_email']}")
            print(f"   Reset Successful: {final['password_reset_successful']}")
            print(f"   Can Login: {final['can_login_with_new_password']}")
            
        else:
            print(f"❌ Full test failed with status {response.status_code}")
            print(f"   Error: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Connection failed - is the server running?")
        return False
    except Exception as e:
        print(f"❌ Test failed: {str(e)}")
        return False
    
    # Test 2: Test direct password update
    print(f"\n2️⃣ Testing direct password update...")
    try:
        response = requests.post(f"{API_BASE_URL}/debug/test-password-update", 
                               json={
                                   "email": TEST_EMAIL,
                                   "new_password": NEW_PASSWORD + "_direct"
                               })
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Direct update test passed")
            print(f"   Update Result: {data['update_result']}")
            print(f"   Verification: {data['verification_success']}")
        else:
            print(f"❌ Direct update test failed: {response.text}")
            
    except Exception as e:
        print(f"❌ Direct update test failed: {str(e)}")
    
    # Test 3: Test password login
    print(f"\n3️⃣ Testing password login...")
    try:
        response = requests.post(f"{API_BASE_URL}/debug/test-password-login", 
                               json={
                                   "email": TEST_EMAIL,
                                   "password": NEW_PASSWORD + "_direct"
                               })
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Login test passed")
            print(f"   Password Valid: {data['password_valid']}")
        else:
            print(f"❌ Login test failed: {response.text}")
            
    except Exception as e:
        print(f"❌ Login test failed: {str(e)}")
    
    print(f"\n🏁 Password reset testing completed!")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        TEST_EMAIL = sys.argv[1]
    if len(sys.argv) > 2:
        API_BASE_URL = sys.argv[2]
    
    print(f"Testing with email: {TEST_EMAIL}")
    print(f"API URL: {API_BASE_URL}")
    print("-" * 50)
    
    test_password_reset()
