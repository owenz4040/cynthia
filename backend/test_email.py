#!/usr/bin/env python3
"""
Quick test to verify environment variables are loaded correctly
"""

import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

print("🔍 Environment Variables Test")
print("=" * 50)

print(f"SMTP_SERVER: {os.environ.get('SMTP_SERVER')}")
print(f"SMTP_PORT: {os.environ.get('SMTP_PORT')}")
print(f"SMTP_USERNAME: {os.environ.get('SMTP_USERNAME')}")
print(f"SMTP_PASSWORD: {'*' * len(os.environ.get('SMTP_PASSWORD', '')) if os.environ.get('SMTP_PASSWORD') else 'None'}")

print("\n🧪 Testing email configuration...")

try:
    import smtplib
    
    smtp_server = os.environ.get('SMTP_SERVER', 'smtp.gmail.com')
    smtp_port = int(os.environ.get('SMTP_PORT', 587))
    smtp_username = os.environ.get('SMTP_USERNAME')
    smtp_password = os.environ.get('SMTP_PASSWORD')
    
    if not smtp_username or not smtp_password:
        print("❌ SMTP credentials not found in environment")
    else:
        print(f"📧 Testing connection to {smtp_server}:{smtp_port}")
        
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        print("✅ TLS connection established")
        
        server.login(smtp_username, smtp_password)
        print("✅ SMTP authentication successful!")
        
        server.quit()
        print("✅ Email configuration is working correctly!")
        
except Exception as e:
    print(f"❌ Email test failed: {str(e)}")

print("\n" + "=" * 50)
