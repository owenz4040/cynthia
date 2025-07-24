#!/usr/bin/env python3
"""
Simple test script to verify profile update functionality
"""

import requests
import json

# Configuration
BASE_URL = "http://localhost:5000/api"

def test_profile_upload():
    """Test profile picture upload"""
    
    # First login to get a token
    login_data = {
        "email": "test@example.com",  # Change this to a real user email
        "password": "testpassword123"
    }
    
    print("Testing user login...")
    try:
        response = requests.post(f"{BASE_URL}/login", json=login_data)
        print(f"Login Response Status: {response.status_code}")
        print(f"Login Response: {response.text}")
        
        if response.status_code == 200:
            login_result = response.json()
            token = login_result.get('token')
            print(f"Token obtained: {token[:50]}...")
            
            # Test profile update with just data (no file)
            print("\nTesting profile update without file...")
            headers = {
                'Authorization': f'Bearer {token}'
            }
            
            # Test with form data
            form_data = {
                'name': 'Updated Test Name'
            }
            
            response = requests.put(f"{BASE_URL}/profile", headers=headers, data=form_data)
            print(f"Profile Update Status: {response.status_code}")
            print(f"Profile Update Response: {response.text}")
            
        else:
            print("Login failed!")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_profile_upload()
