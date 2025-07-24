"""
Email utilities for sending OTP and other notifications.
"""

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from flask import current_app
import os

def send_otp_email(to_email, otp_code, user_name="User"):
    """Send OTP verification email."""
    try:
        # Email configuration
        smtp_server = current_app.config.get('SMTP_SERVER', 'smtp.gmail.com')
        smtp_port = current_app.config.get('SMTP_PORT', 587)
        smtp_username = current_app.config.get('SMTP_USERNAME')
        smtp_password = current_app.config.get('SMTP_PASSWORD')
        
        print(f"📧 Email configuration debug:")
        print(f"   SMTP Server: {smtp_server}")
        print(f"   SMTP Port: {smtp_port}")
        print(f"   SMTP Username: {smtp_username}")
        print(f"   SMTP Password: {'*' * len(smtp_password) if smtp_password else 'None'}")
        
        if not smtp_username or not smtp_password:
            print("❌ SMTP credentials not configured")
            return False
        
        # Create message
        msg = MIMEMultipart()
        msg['From'] = smtp_username
        msg['To'] = to_email
        msg['Subject'] = "🏠 Rental System - Email Verification"
        
        # HTML email body
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }}
                .container {{ max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }}
                .header {{ background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%); padding: 30px; text-align: center; color: white; }}
                .content {{ padding: 30px; }}
                .otp-box {{ background: #f8f9fa; border: 2px dashed #dc2743; border-radius: 10px; padding: 20px; text-align: center; margin: 20px 0; }}
                .otp-code {{ font-size: 32px; font-weight: bold; color: #dc2743; letter-spacing: 5px; margin: 10px 0; }}
                .footer {{ background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px; }}
                .button {{ display: inline-block; background: linear-gradient(45deg, #f09433, #dc2743); color: white; padding: 12px 24px; text-decoration: none; border-radius: 25px; font-weight: bold; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🏠 Welcome to Rental System</h1>
                    <p>Email Verification Required</p>
                </div>
                <div class="content">
                    <h2>Hello {user_name}!</h2>
                    <p>Thank you for registering with our Rental House Booking System. To complete your registration, please verify your email address using the OTP code below:</p>
                    
                    <div class="otp-box">
                        <p><strong>Your Verification Code:</strong></p>
                        <div class="otp-code">{otp_code}</div>
                        <p><small>This code expires in 10 minutes</small></p>
                    </div>
                    <p style="text-align:center; margin:20px 0;">
                        <a href="{current_app.url_root}api/verify-email/{to_email}/{otp_code}" class="button">Verify Email Now</a>
                    </p>
                    
                    <p>Enter this code on the verification page to activate your account and start browsing amazing rental properties!</p>
                    
                    <p><strong>What's next?</strong></p>
                    <ul>
                        <li>✅ Verify your email with the code above</li>
                        <li>🏠 Browse beautiful rental properties</li>
                        <li>📱 Enjoy our Instagram-inspired interface</li>
                        <li>🔒 Secure booking and profile management</li>
                    </ul>
                    
                    <p>If you didn't request this verification, please ignore this email.</p>
                </div>
                <div class="footer">
                    <p>© 2025 Rental House Booking System</p>
                    <p>Instagram-inspired design • MongoDB powered • Cloudinary enhanced</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        msg.attach(MIMEText(html_body, 'html'))
        
        # Send email with detailed logging
        print(f"📧 Attempting to send email to {to_email}")
        print(f"📧 Connecting to SMTP server: {smtp_server}:{smtp_port}")
        
        server = smtplib.SMTP(smtp_server, smtp_port)
        print("📧 SMTP connection established")
        
        server.starttls()
        print("📧 TLS encryption started")
        
        server.login(smtp_username, smtp_password)
        print("📧 SMTP authentication successful")
        
        text = msg.as_string()
        server.sendmail(smtp_username, to_email, text)
        print("📧 Email sent successfully")
        
        server.quit()
        print("📧 SMTP connection closed")
        
        print(f"✅ OTP email sent to {to_email}")
        return True
        
    except smtplib.SMTPAuthenticationError as e:
        print(f"❌ SMTP Authentication failed: {str(e)}")
        print("❌ Check your email credentials and app password")
        return False
    except smtplib.SMTPRecipientsRefused as e:
        print(f"❌ Email recipient refused: {str(e)}")
        return False
    except smtplib.SMTPServerDisconnected as e:
        print(f"❌ SMTP server disconnected: {str(e)}")
        return False
    except Exception as e:
        print(f"❌ Failed to send OTP email: {str(e)}")
        print(f"❌ Error type: {type(e).__name__}")
        return False

def send_welcome_email(to_email, user_name):
    """Send welcome email after successful verification."""
    try:
        smtp_server = current_app.config.get('SMTP_SERVER', 'smtp.gmail.com')
        smtp_port = current_app.config.get('SMTP_PORT', 587)
        smtp_username = current_app.config.get('SMTP_USERNAME')
        smtp_password = current_app.config.get('SMTP_PASSWORD')
        
        if not smtp_username or not smtp_password:
            return False
        
        msg = MIMEMultipart()
        msg['From'] = smtp_username
        msg['To'] = to_email
        msg['Subject'] = "🎉 Welcome to Rental System - Account Verified!"
        
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }}
                .container {{ max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }}
                .header {{ background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%); padding: 30px; text-align: center; color: white; }}
                .content {{ padding: 30px; }}
                .feature-box {{ background: #f8f9fa; border-left: 4px solid #dc2743; padding: 15px; margin: 15px 0; }}
                .footer {{ background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎉 Welcome {user_name}!</h1>
                    <p>Your account has been successfully verified</p>
                </div>
                <div class="content">
                    <h2>You're all set! 🚀</h2>
                    <p>Congratulations! Your email has been verified and your account is now active. You can now access all features of our Rental House Booking System.</p>
                    
                    <div class="feature-box">
                        <h3>🏠 What you can do now:</h3>
                        <ul>
                            <li>Browse beautiful rental properties</li>
                            <li>View detailed property information and photos</li>
                            <li>Manage your profile and preferences</li>
                            <li>Experience our Instagram-inspired interface</li>
                        </ul>
                    </div>
                    
                    <div class="feature-box">
                        <h3>🔒 Your account is secure:</h3>
                        <ul>
                            <li>JWT-based authentication</li>
                            <li>Encrypted password storage</li>
                            <li>Session-based access control</li>
                            <li>Email verification completed</li>
                        </ul>
                    </div>
                    
                    <p>Ready to find your perfect rental? Login to your account and start exploring!</p>
                </div>
                <div class="footer">
                    <p>© 2025 Rental House Booking System</p>
                    <p>Thank you for choosing us for your rental needs!</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        msg.attach(MIMEText(html_body, 'html'))
        
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(smtp_username, smtp_password)
        text = msg.as_string()
        server.sendmail(smtp_username, to_email, text)
        server.quit()
        
        print(f"✅ Welcome email sent to {to_email}")
        return True
        
    except Exception as e:
        print(f"❌ Failed to send welcome email: {str(e)}")
        return False

def send_booking_receipt_email(user_email, user_name, house_name, house_location, booking_date, booking_time, admin_notes=''):
    """Send booking approval receipt email to user."""
    try:
        # Get SMTP configuration
        smtp_server = os.getenv('SMTP_SERVER')
        smtp_port = int(os.getenv('SMTP_PORT', 587))
        smtp_username = os.getenv('SMTP_USERNAME')
        smtp_password = os.getenv('SMTP_PASSWORD')
        
        if not all([smtp_server, smtp_port, smtp_username, smtp_password]):
            print("❌ SMTP configuration incomplete")
            return False
        
        # Create message
        msg = MIMEMultipart('alternative')
        msg['From'] = smtp_username
        msg['To'] = user_email
        msg['Subject'] = f"✅ Site Review Booking Confirmed - {house_name}"
        
        # HTML content
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                .container {{ max-width: 600px; margin: 0 auto; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }}
                .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }}
                .content {{ padding: 30px; background: #f8f9ff; }}
                .booking-card {{ background: white; border-radius: 12px; padding: 20px; margin: 20px 0; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }}
                .booking-details {{ margin: 20px 0; }}
                .detail-row {{ margin: 10px 0; padding: 10px; background: #f0f4ff; border-left: 4px solid #667eea; }}
                .status {{ background: #d4edda; color: #155724; padding: 10px; border-radius: 6px; text-align: center; font-weight: bold; }}
                .footer {{ background: #2c3e50; color: white; padding: 20px; text-align: center; }}
                .important {{ background: #fff3cd; border: 2px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🏠 Site Review Booking Confirmed!</h1>
                    <p>Your property viewing has been approved</p>
                </div>
                <div class="content">
                    <p>Dear {user_name},</p>
                    
                    <div class="status">
                        ✅ BOOKING APPROVED
                    </div>
                    
                    <p>Great news! Your site review booking has been approved. Here are your confirmed details:</p>
                    
                    <div class="booking-card">
                        <h3>📋 Booking Details</h3>
                        <div class="booking-details">
                            <div class="detail-row">
                                <strong>🏡 Property:</strong> {house_name}
                            </div>
                            <div class="detail-row">
                                <strong>📍 Location:</strong> {house_location}
                            </div>
                            <div class="detail-row">
                                <strong>📅 Date:</strong> {booking_date}
                            </div>
                            <div class="detail-row">
                                <strong>🕐 Time:</strong> {booking_time}
                            </div>
                            {f'<div class="detail-row"><strong>📝 Admin Notes:</strong> {admin_notes}</div>' if admin_notes else ''}
                        </div>
                    </div>
                    
                    <div class="important">
                        <h4>📌 Important Reminders:</h4>
                        <ul>
                            <li>Please arrive on time for your scheduled viewing</li>
                            <li>Bring a valid ID for verification</li>
                            <li>Feel free to ask questions during the tour</li>
                            <li>Contact us if you need to reschedule</li>
                        </ul>
                    </div>
                    
                    <p>We look forward to showing you this beautiful property!</p>
                    
                    <p>If you have any questions or need to make changes, please contact our support team.</p>
                </div>
                <div class="footer">
                    <p>© 2025 Rental System</p>
                    <p>Thank you for choosing us for your rental needs!</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        msg.attach(MIMEText(html_body, 'html'))
        
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(smtp_username, smtp_password)
        text = msg.as_string()
        server.sendmail(smtp_username, user_email, text)
        server.quit()
        
        print(f"✅ Booking receipt email sent to {user_email}")
        return True
        
    except Exception as e:
        print(f"❌ Failed to send booking receipt email: {str(e)}")
        return False

def send_booking_update_email(user_email, user_name, house_name, status, admin_notes=''):
    """Send booking status update email to user."""
    try:
        # Get SMTP configuration
        smtp_server = os.getenv('SMTP_SERVER')
        smtp_port = int(os.getenv('SMTP_PORT', 587))
        smtp_username = os.getenv('SMTP_USERNAME')
        smtp_password = os.getenv('SMTP_PASSWORD')
        
        if not all([smtp_server, smtp_port, smtp_username, smtp_password]):
            print("❌ SMTP configuration incomplete")
            return False
        
        # Determine email content based on status
        if status == 'rejected':
            subject = f"❌ Site Review Booking Update - {house_name}"
            status_message = "Unfortunately, your booking request has been declined."
            status_class = "rejected"
            status_color = "#f8d7da"
            icon = "❌"
        elif status == 'completed':
            subject = f"✅ Site Review Completed - {house_name}"
            status_message = "Your site review has been completed. Thank you!"
            status_class = "completed"
            status_color = "#d4edda"
            icon = "✅"
        else:
            subject = f"📝 Site Review Booking Update - {house_name}"
            status_message = f"Your booking status has been updated to: {status.title()}"
            status_class = "updated"
            status_color = "#d1ecf1"
            icon = "📝"
        
        # Create message
        msg = MIMEMultipart('alternative')
        msg['From'] = smtp_username
        msg['To'] = user_email
        msg['Subject'] = subject
        
        # HTML content
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                .container {{ max-width: 600px; margin: 0 auto; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }}
                .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }}
                .content {{ padding: 30px; background: #f8f9ff; }}
                .status {{ background: {status_color}; padding: 15px; border-radius: 8px; text-align: center; font-weight: bold; margin: 20px 0; }}
                .booking-card {{ background: white; border-radius: 12px; padding: 20px; margin: 20px 0; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }}
                .footer {{ background: #2c3e50; color: white; padding: 20px; text-align: center; }}
                .notes {{ background: #fff3cd; border-left: 4px solid #ffeaa7; padding: 15px; margin: 20px 0; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>{icon} Booking Update</h1>
                    <p>Site Review for {house_name}</p>
                </div>
                <div class="content">
                    <p>Dear {user_name},</p>
                    
                    <div class="status">
                        {status_message}
                    </div>
                    
                    <div class="booking-card">
                        <h3>📋 Booking Information</h3>
                        <p><strong>🏡 Property:</strong> {house_name}</p>
                        <p><strong>📊 Status:</strong> {status.title()}</p>
                    </div>
                    
                    {f'<div class="notes"><h4>📝 Admin Notes:</h4><p>{admin_notes}</p></div>' if admin_notes else ''}
                    
                    <p>If you have any questions about this update, please don't hesitate to contact our support team.</p>
                    
                    <p>Thank you for your interest in our properties!</p>
                </div>
                <div class="footer">
                    <p>© 2025 Rental System</p>
                    <p>Your trusted rental platform</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        msg.attach(MIMEText(html_body, 'html'))
        
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(smtp_username, smtp_password)
        text = msg.as_string()
        server.sendmail(smtp_username, user_email, text)
        server.quit()
        
        print(f"✅ Booking update email sent to {user_email}")
        return True
        
    except Exception as e:
        print(f"❌ Failed to send booking update email: {str(e)}")
        return False
