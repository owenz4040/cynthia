#!/usr/bin/env python3
"""
Test script for the Rental System Chatbot
Tests various conversation scenarios and API endpoints
"""

import requests
import json
import time
from datetime import datetime

class ChatbotTester:
    def __init__(self, api_base="http://localhost:5000/api"):
        self.api_base = api_base
        self.test_results = []
        
    def test_message_endpoint(self):
        """Test the main chatbot message endpoint"""
        print("🧪 Testing chatbot message endpoint...")
        
        test_messages = [
            "Hello",
            "What features does this system have?",
            "How do I register?",
            "Show me available properties",
            "What are the pricing options?",
            "How can I book a property?",
            "Is the system mobile-friendly?",
            "Show me system statistics",
            "I need technical support",
            "What security measures are in place?"
        ]
        
        for message in test_messages:
            try:
                response = requests.post(
                    f"{self.api_base}/chatbot/message",
                    json={"message": message},
                    headers={"Content-Type": "application/json"},
                    timeout=10
                )
                
                if response.status_code == 200:
                    data = response.json()
                    confidence = data.get('confidence', 0)
                    category = data.get('category', 'unknown')
                    
                    print(f"✅ '{message}' -> Category: {category}, Confidence: {confidence:.2f}")
                    self.test_results.append({
                        'message': message,
                        'status': 'success',
                        'category': category,
                        'confidence': confidence
                    })
                else:
                    print(f"❌ '{message}' -> HTTP {response.status_code}")
                    self.test_results.append({
                        'message': message,
                        'status': 'failed',
                        'error': f"HTTP {response.status_code}"
                    })
                    
            except Exception as e:
                print(f"❌ '{message}' -> Error: {str(e)}")
                self.test_results.append({
                    'message': message,
                    'status': 'error',
                    'error': str(e)
                })
            
            time.sleep(0.5)  # Avoid overwhelming the server
    
    def test_suggestions_endpoint(self):
        """Test the suggestions endpoint"""
        print("\n🧪 Testing suggestions endpoint...")
        
        try:
            response = requests.get(f"{self.api_base}/chatbot/suggestions")
            
            if response.status_code == 200:
                data = response.json()
                suggestions = data.get('suggestions', [])
                print(f"✅ Suggestions endpoint: {len(suggestions)} suggestions received")
                return True
            else:
                print(f"❌ Suggestions endpoint: HTTP {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Suggestions endpoint: Error {str(e)}")
            return False
    
    def test_quick_info_endpoint(self):
        """Test the quick info endpoint"""
        print("\n🧪 Testing quick info endpoint...")
        
        try:
            response = requests.get(f"{self.api_base}/chatbot/quick-info")
            
            if response.status_code == 200:
                data = response.json()
                info = data.get('info', {})
                print(f"✅ Quick info endpoint: System '{info.get('system_name', 'Unknown')}' status: {info.get('status', 'Unknown')}")
                return True
            else:
                print(f"❌ Quick info endpoint: HTTP {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Quick info endpoint: Error {str(e)}")
            return False
    
    def test_health_check(self):
        """Test if the backend is running"""
        print("🧪 Testing backend health...")
        
        try:
            response = requests.get(f"{self.api_base.replace('/api', '')}/health")
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Backend health: {data.get('status', 'unknown')} - {data.get('message', '')}")
                return True
            else:
                print(f"❌ Backend health: HTTP {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Backend health: Error {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all chatbot tests"""
        print("🚀 Starting Chatbot Test Suite")
        print("=" * 50)
        
        # Test backend health first
        if not self.test_health_check():
            print("\n❌ Backend is not running. Please start the Flask server first.")
            return False
        
        # Test all endpoints
        self.test_message_endpoint()
        self.test_suggestions_endpoint()
        self.test_quick_info_endpoint()
        
        # Print summary
        self.print_summary()
        
        return True
    
    def print_summary(self):
        """Print test results summary"""
        print("\n" + "=" * 50)
        print("📊 TEST SUMMARY")
        print("=" * 50)
        
        total_tests = len(self.test_results)
        successful_tests = len([r for r in self.test_results if r['status'] == 'success'])
        failed_tests = total_tests - successful_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"Successful: {successful_tests}")
        print(f"Failed: {failed_tests}")
        print(f"Success Rate: {(successful_tests/total_tests*100):.1f}%" if total_tests > 0 else "No tests run")
        
        # Show confidence distribution
        if successful_tests > 0:
            confidences = [r['confidence'] for r in self.test_results if r['status'] == 'success']
            avg_confidence = sum(confidences) / len(confidences)
            print(f"Average Confidence: {avg_confidence:.2f}")
        
        # Show category distribution
        categories = {}
        for result in self.test_results:
            if result['status'] == 'success':
                cat = result.get('category', 'unknown')
                categories[cat] = categories.get(cat, 0) + 1
        
        if categories:
            print("\nCategory Distribution:")
            for category, count in categories.items():
                print(f"  {category}: {count}")
        
        print("\n🎉 Test suite completed!")

if __name__ == "__main__":
    # Run the test suite
    tester = ChatbotTester()
    
    print("🤖 Rental System Chatbot Test Suite")
    print(f"⏰ Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    try:
        success = tester.run_all_tests()
        
        if success:
            print("\n✅ All tests completed successfully!")
        else:
            print("\n❌ Some tests failed. Check the backend server.")
            
    except KeyboardInterrupt:
        print("\n\n⚠️ Tests interrupted by user")
    except Exception as e:
        print(f"\n\n❌ Test suite failed: {str(e)}")
    
    print(f"\n⏰ Finished at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
